// Run with: npm run test:worker
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import worker, { handleApi, type Deps, type Env } from "./index.ts";
import { checkContact, composeContactEmail } from "./forms.ts";

const ORIGIN = "https://test.example";

const env: Env = {
  ASSETS: { fetch: async () => new Response("the static site") },
  RESEND_API_KEY: "re_secret_key",
  CONTACT_TO: "team@example.com",
  CONTACT_FROM: "Hubble Bubble website <onboarding@resend.dev>",
};

const good = {
  type: "student",
  name: "Asha Rao",
  email: "asha@example.com",
  message: "I would like to study in Scotland.",
  destination: "United Kingdom",
  level: "Postgraduate",
  elapsedMs: 6000,
  _gotcha: "",
};

type Call = { url: string; init: RequestInit };

function fakeResend(reply: () => Response | Promise<Response> = () => new Response('{"id":"abc"}', { status: 200 })) {
  const calls: Call[] = [];
  const deps: Deps = {
    fetch: async (url, init) => {
      calls.push({ url, init });
      return reply();
    },
    now: () => new Date("2026-10-20T10:00:00.000Z"),
  };
  return { calls, deps };
}

function post(body: unknown, headers: Record<string, string> = {}, path = "/api/contact") {
  return new Request(ORIGIN + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function json(res: Response) {
  return (await res.json()) as Record<string, unknown>;
}

describe("contact form endpoint", () => {
  it("sends a good enquiry to the team inbox through Resend", async () => {
    const { calls, deps } = fakeResend();
    const res = await handleApi(post(good), env, deps);
    assert.equal(res.status, 200);
    assert.deepEqual(await json(res), { ok: true });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.resend.com/emails");
    const headers = calls[0].init.headers as Record<string, string>;
    assert.equal(headers.Authorization, "Bearer re_secret_key");
    const sent = JSON.parse(calls[0].init.body as string);
    assert.equal(sent.from, env.CONTACT_FROM);
    assert.deepEqual(sent.to, ["team@example.com"]);
    assert.equal(sent.reply_to, "asha@example.com");
    assert.equal(sent.subject, "Student enquiry from Asha Rao");
    assert.match(sent.text, /Name: Asha Rao/);
    assert.match(sent.text, /Email: asha@example.com/);
    assert.match(sent.text, /Interested in studying: United Kingdom/);
    assert.match(sent.text, /Study level: Postgraduate/);
    assert.match(sent.text, /I would like to study in Scotland\./);
    assert.match(sent.text, /test\.example/);
    assert.match(sent.text, /2026-10-20T10:00:00\.000Z/);
  });

  it("never lets the visitor choose where the email goes", async () => {
    const { calls, deps } = fakeResend();
    await handleApi(post({ ...good, to: "victim@example.com", from: "boss@example.com", cc: "x@example.com" }), env, deps);
    const sent = JSON.parse(calls[0].init.body as string);
    assert.deepEqual(sent.to, ["team@example.com"]);
    assert.equal(sent.from, env.CONTACT_FROM);
    assert.equal(sent.cc, undefined);
  });

  it("drops a submission whose hidden field is filled in, and says it worked", async () => {
    const { calls, deps } = fakeResend();
    const res = await handleApi(post({ ...good, _gotcha: "http://spam.example" }), env, deps);
    assert.equal(res.status, 200);
    assert.deepEqual(await json(res), { ok: true });
    assert.equal(calls.length, 0);
  });

  it("rejects a form sent faster than a person could fill it in", async () => {
    const { calls, deps } = fakeResend();
    const res = await handleApi(post({ ...good, elapsedMs: 200 }), env, deps);
    assert.equal(res.status, 400);
    assert.equal((await json(res)).error, "too_fast");
    assert.equal(calls.length, 0);
  });

  it("rejects a form with no timing at all", async () => {
    const { calls, deps } = fakeResend();
    const { elapsedMs: _omit, ...withoutTiming } = good;
    void _omit;
    const res = await handleApi(post(withoutTiming), env, deps);
    assert.equal(res.status, 400);
    assert.equal(calls.length, 0);
  });

  it("explains which fields are wrong", async () => {
    const { calls, deps } = fakeResend();
    const res = await handleApi(post({ type: "student", name: " ", email: "not-an-email", message: "", elapsedMs: 5000 }), env, deps);
    assert.equal(res.status, 400);
    const body = await json(res);
    assert.equal(body.error, "invalid");
    assert.deepEqual(Object.keys(body.fields as object).sort(), ["email", "message", "name"]);
    assert.equal(calls.length, 0);
  });

  it("rejects an unknown form type", async () => {
    const { deps } = fakeResend();
    const res = await handleApi(post({ ...good, type: "sales" }), env, deps);
    assert.equal(res.status, 400);
  });

  it("rejects a message that is too long", async () => {
    const { deps } = fakeResend();
    const res = await handleApi(post({ ...good, message: "a".repeat(5001) }), env, deps);
    assert.equal(res.status, 400);
    assert.ok((await json(res)).fields);
  });

  it("rejects a request from another website", async () => {
    const { calls, deps } = fakeResend();
    const res = await handleApi(post(good, { Origin: "https://evil.example" }), env, deps);
    assert.equal(res.status, 403);
    assert.equal(calls.length, 0);
  });

  it("only accepts POST", async () => {
    const { deps } = fakeResend();
    const res = await handleApi(new Request(ORIGIN + "/api/contact"), env, deps);
    assert.equal(res.status, 405);
    assert.equal(res.headers.get("Allow"), "POST");
  });

  it("returns 404 for other /api/ addresses", async () => {
    const { deps } = fakeResend();
    const res = await handleApi(post(good, {}, "/api/anything-else"), env, deps);
    assert.equal(res.status, 404);
  });

  it("only accepts JSON", async () => {
    const { deps } = fakeResend();
    const res = await handleApi(post("name=x", { "Content-Type": "text/plain" }), env, deps);
    assert.equal(res.status, 415);
  });

  it("rejects broken JSON and non-objects", async () => {
    const { deps } = fakeResend();
    assert.equal((await handleApi(post("{not json"), env, deps)).status, 400);
    assert.equal((await handleApi(post("[1,2]"), env, deps)).status, 400);
    assert.equal((await handleApi(post("null"), env, deps)).status, 400);
  });

  it("rejects an oversized request", async () => {
    const { calls, deps } = fakeResend();
    const res = await handleApi(post({ ...good, message: "a".repeat(50_000) }), env, deps);
    assert.equal(res.status, 413);
    assert.equal(calls.length, 0);
  });

  it("says the form is not set up when the Resend key is missing", async () => {
    const { calls, deps } = fakeResend();
    const res = await handleApi(post(good), { ...env, RESEND_API_KEY: undefined }, deps);
    assert.equal(res.status, 503);
    assert.equal((await json(res)).error, "not_configured");
    assert.equal(calls.length, 0);
  });

  it("reports a failure when Resend refuses, without leaking the key or details", async () => {
    const { deps } = fakeResend(() => new Response('{"name":"validation_error","message":"nope"}', { status: 403 }));
    const res = await handleApi(post(good), env, deps);
    assert.equal(res.status, 502);
    const text = JSON.stringify(await json(res));
    assert.ok(!text.includes("re_secret_key"));
    assert.ok(!text.includes("nope"));
  });

  it("reports a failure when Resend cannot be reached", async () => {
    const deps: Deps = {
      fetch: async () => {
        throw new Error("network down");
      },
      now: () => new Date(),
    };
    const res = await handleApi(post(good), env, deps);
    assert.equal(res.status, 502);
  });

  it("never lets the browser or Cloudflare cache an answer", async () => {
    const { deps } = fakeResend();
    const res = await handleApi(post(good), env, deps);
    assert.equal(res.headers.get("Cache-Control"), "no-store");
  });
});

const goodEligibility = {
  name: "Ravi Menon",
  email: "ravi@example.com",
  age: "24",
  qualification: "BEng Mechanical",
  contactNumber: "+91 98765 43210",
  studyStatus: "I am not sure which university or course to apply for",
  countries: ["UK", "Germany"],
  universities: ["University of Dundee", "TU Munich"],
  nextStep: "bookCall",
  elapsedMs: 20000,
};

describe("eligibility check endpoint", () => {
  const eligibilityPost = (body: unknown) => post(body, {}, "/api/eligibility");

  it("emails the details to the team inbox", async () => {
    const { calls, deps } = fakeResend();
    const res = await handleApi(eligibilityPost(goodEligibility), env, deps);
    assert.equal(res.status, 200);
    assert.equal(calls.length, 1);
    const sent = JSON.parse(calls[0].init.body as string);
    assert.deepEqual(sent.to, ["team@example.com"]);
    assert.equal(sent.reply_to, "ravi@example.com");
    assert.equal(sent.subject, "Eligibility check from Ravi Menon");
    assert.match(sent.text, /Age: 24/);
    assert.match(sent.text, /Current qualification: BEng Mechanical/);
    assert.match(sent.text, /Contact number: \+91 98765 43210/);
    assert.match(sent.text, /Preferred countries: UK, Germany/);
    assert.match(sent.text, /Preferred universities: University of Dundee; TU Munich/);
    assert.match(sent.text, /Wants to book a call with a mentor/);
  });

  it("notes when they will email their documents", async () => {
    const { calls, deps } = fakeResend();
    await handleApi(eligibilityPost({ ...goodEligibility, nextStep: "sendEmail" }), env, deps);
    const sent = JSON.parse(calls[0].init.body as string);
    assert.match(sent.text, /Will email their documents/);
  });

  it("does not accept document uploads or other next steps", async () => {
    const { calls, deps } = fakeResend();
    const res = await handleApi(eligibilityPost({ ...goodEligibility, nextStep: "uploadNow" }), env, deps);
    assert.equal(res.status, 400);
    assert.ok("nextStep" in ((await json(res)).fields as object));
    assert.equal(calls.length, 0);
  });

  it("explains which details are missing", async () => {
    const { calls, deps } = fakeResend();
    const res = await handleApi(eligibilityPost({ elapsedMs: 20000 }), env, deps);
    assert.equal(res.status, 400);
    const fields = Object.keys((await json(res)).fields as object).sort();
    assert.deepEqual(fields, ["age", "contactNumber", "countries", "email", "name", "nextStep", "qualification", "studyStatus", "universities"]);
    assert.equal(calls.length, 0);
  });

  it("needs lists to be lists", async () => {
    const { deps } = fakeResend();
    const res = await handleApi(eligibilityPost({ ...goodEligibility, countries: "UK", universities: "Dundee" }), env, deps);
    assert.equal(res.status, 400);
  });

  it("keeps only the first ten universities", async () => {
    const { calls, deps } = fakeResend();
    const many = Array.from({ length: 15 }, (_, i) => `University ${i + 1}`);
    await handleApi(eligibilityPost({ ...goodEligibility, universities: many }), env, deps);
    const sent = JSON.parse(calls[0].init.body as string);
    assert.match(sent.text, /University 10/);
    assert.ok(!/University 11/.test(sent.text));
  });

  it("applies the same spam checks as the contact form", async () => {
    const { calls, deps } = fakeResend();
    const fast = await handleApi(eligibilityPost({ ...goodEligibility, elapsedMs: 100 }), env, deps);
    assert.equal(fast.status, 400);
    const trapped = await handleApi(eligibilityPost({ ...goodEligibility, _gotcha: "x" }), env, deps);
    assert.equal(trapped.status, 200);
    assert.equal(calls.length, 0);
  });
});

describe("worker entry point", () => {
  it("passes everything outside /api/ to the static site", async () => {
    const res = await worker.fetch(new Request(ORIGIN + "/about/"), env);
    assert.equal(await res.text(), "the static site");
  });

  it("handles /api/ itself", async () => {
    const res = await worker.fetch(new Request(ORIGIN + "/api/nope"), env);
    assert.equal(res.status, 404);
  });
});

describe("checking and writing the contact email", () => {
  it("tidies names and keeps the subject on one line", () => {
    const checked = checkContact({ ...good, name: "  Asha\r\nBcc: x@y.z   Rao  " });
    assert.ok(checked.ok);
    const email = composeContactEmail(checked.value, { host: "h", at: new Date(0) });
    assert.ok(!/[\r\n]/.test(email.subject));
    assert.equal(email.subject, "Student enquiry from Asha Bcc: x@y.z Rao");
  });

  it("keeps line breaks in the message", () => {
    const checked = checkContact({ ...good, message: "line one\r\nline two" });
    assert.ok(checked.ok);
    assert.equal(checked.value.message, "line one\nline two");
  });

  it("ignores student fields on a collaboration enquiry and shows the organisation", () => {
    const checked = checkContact({ ...good, type: "collab", organisation: "Acme Ltd" });
    assert.ok(checked.ok);
    const email = composeContactEmail(checked.value, { host: "h", at: new Date(0) });
    assert.match(email.text, /Organisation or project: Acme Ltd/);
    assert.ok(!/Interested in studying/.test(email.text));
    assert.equal(email.subject, "Collaboration enquiry from Asha Rao");
  });

  it("rejects an email address with spaces or no domain", () => {
    for (const bad of ["a b@c.de", "a@b", "@b.co", "a@@b.co"]) {
      assert.ok(!checkContact({ ...good, email: bad }).ok, bad);
    }
  });
});
