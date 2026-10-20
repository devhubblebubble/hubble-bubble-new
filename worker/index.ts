// Cloudflare Worker for the Hubble Bubble site.
//
// The site itself is plain static files that Cloudflare serves without running
// any code. This Worker only wakes up for addresses starting with /api/ (see
// "run_worker_first" in wrangler.jsonc). Today that is the contact form and the
// eligibility check. It checks what the visitor sent, then emails it to the
// team's inbox through Resend.
//
// Settings (in wrangler.jsonc, and the secret in the Cloudflare dashboard):
//   RESEND_API_KEY   secret, from resend.com
//   CONTACT_TO       the inbox that receives enquiries
//   CONTACT_FROM     the sender shown on those emails

import {
  checkContact,
  checkEligibility,
  composeContactEmail,
  composeEligibilityEmail,
  type Email,
} from "./forms.ts";

export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
}

/** Things the handler needs from outside, so tests can swap them. */
export interface Deps {
  fetch: (url: string, init: RequestInit) => Promise<Response>;
  now: () => Date;
}

const defaultDeps: Deps = {
  // Wrapped on purpose: calling the built-in fetch as "deps.fetch(...)" fails
  // on Cloudflare with "Illegal invocation".
  fetch: (url, init) => fetch(url, init),
  now: () => new Date(),
};

const RESEND_URL = "https://api.resend.com/emails";

/** Largest request we read (a 5,000 character message is well under this). */
const MAX_BODY = 40_000;

/** A person needs more than this to fill in a form. Scripts are faster. */
const MIN_FILL_MS = 1500;

type Meta = { host: string; at: Date };

type Prepared = { ok: true; email: Email } | { ok: false; fields: Record<string, string> };

/** One form: checks what the visitor sent and, if it is fine, writes the email. */
type FormRoute = { prepare: (input: Record<string, unknown>, meta: Meta) => Prepared };

const ROUTES: Record<string, FormRoute> = {
  "/api/contact": {
    prepare(input, meta) {
      const checked = checkContact(input);
      return checked.ok
        ? { ok: true, email: composeContactEmail(checked.value, meta) }
        : { ok: false, fields: checked.fields };
    },
  },
  "/api/eligibility": {
    prepare(input, meta) {
      const checked = checkEligibility(input);
      return checked.ok
        ? { ok: true, email: composeEligibilityEmail(checked.value, meta) }
        : { ok: false, fields: checked.fields };
    },
  },
};

function reply(status: number, body: Record<string, unknown>, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extra,
    },
  });
}

export async function handleApi(
  request: Request,
  env: Env,
  deps: Deps = defaultDeps,
): Promise<Response> {
  const url = new URL(request.url);
  const route = ROUTES[url.pathname];
  if (!route) return reply(404, { ok: false, error: "not_found" });
  if (request.method !== "POST") {
    return reply(405, { ok: false, error: "method_not_allowed" }, { Allow: "POST" });
  }

  // Only the site's own pages may send to this address.
  const origin = request.headers.get("Origin");
  if (origin && origin !== url.origin) return reply(403, { ok: false, error: "wrong_origin" });

  const contentType = (request.headers.get("Content-Type") ?? "").toLowerCase();
  if (!contentType.startsWith("application/json")) {
    return reply(415, { ok: false, error: "json_only" });
  }

  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_BODY) {
    return reply(413, { ok: false, error: "too_big" });
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY) return reply(413, { ok: false, error: "too_big" });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return reply(400, { ok: false, error: "bad_json" });
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return reply(400, { ok: false, error: "bad_json" });
  }
  const input = parsed as Record<string, unknown>;

  // A hidden field that people never see. Bots fill it in. Tell them it worked
  // and throw the message away.
  if (typeof input._gotcha === "string" && input._gotcha.trim() !== "") {
    console.log(`Dropped a submission to ${url.pathname}: hidden field was filled in`);
    return reply(200, { ok: true });
  }

  const elapsed = typeof input.elapsedMs === "number" ? input.elapsedMs : NaN;
  if (!(elapsed >= MIN_FILL_MS)) {
    console.log(`Dropped a submission to ${url.pathname}: sent too fast`);
    return reply(400, { ok: false, error: "too_fast" });
  }

  const prepared = route.prepare(input, { host: url.host, at: deps.now() });
  if (!prepared.ok) return reply(400, { ok: false, error: "invalid", fields: prepared.fields });
  const email = prepared.email;

  const missing = (["RESEND_API_KEY", "CONTACT_TO", "CONTACT_FROM"] as const).filter((k) => !env[k]);
  if (missing.length > 0) {
    console.error(`Form email is not set up. Missing: ${missing.join(", ")}`);
    // Setting names only, never values
    return reply(503, { ok: false, error: "not_configured", missing });
  }

  try {
    const res = await deps.fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": "hubble-bubble-website/1.0",
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM,
        to: [env.CONTACT_TO],
        reply_to: email.replyTo,
        subject: email.subject,
        text: email.text,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 4000);
      console.error(`Resend refused the email (${res.status}): ${detail.slice(0, 300)}`);
      // Only the status number and Resend's short error name go back to the
      // browser. Its full message can include the account's email address.
      return reply(502, { ok: false, error: "send_failed", upstream: res.status, reason: refusalName(detail) });
    }
  } catch (err) {
    console.error(`Could not reach Resend: ${String(err)}`);
    const reason = err instanceof Error && err.name === "TimeoutError" ? "timeout" : "network";
    return reply(502, { ok: false, error: "send_failed", reason });
  }

  return reply(200, { ok: true });
}

/** Resend's short error name (like "validation_error") from its reply, if it has one. */
function refusalName(body: string): string | undefined {
  try {
    const name = (JSON.parse(body) as { name?: unknown }).name;
    return typeof name === "string" && /^[A-Za-z0-9_]{1,40}$/.test(name) ? name : undefined;
  } catch {
    return undefined;
  }
}

const handler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname.startsWith("/api/")) return handleApi(request, env);
    // Anything else is the static site.
    return env.ASSETS.fetch(request);
  },
};

export default handler;
