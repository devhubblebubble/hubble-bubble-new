// Form logic with no network calls: checks what a visitor sent and writes the
// email. Kept separate from index.ts so it can be tested without Cloudflare.

export type EnquiryType = "student" | "collab" | "general";

export type ContactEnquiry = {
  type: EnquiryType;
  name: string;
  email: string;
  message: string;
  /** Student enquiries only */
  destination: string;
  level: string;
  /** Collaboration enquiries only */
  organisation: string;
};

export type Email = {
  subject: string;
  text: string;
  replyTo: string;
};

export type Checked<T> =
  | { ok: true; value: T }
  | { ok: false; fields: Record<string, string> };

export const LIMITS = {
  name: 120,
  email: 254,
  message: 5000,
  short: 200,
} as const;

const TYPES: readonly EnquiryType[] = ["student", "collab", "general"];

const TYPE_LABEL: Record<EnquiryType, string> = {
  student: "Student enquiry",
  collab: "Collaboration enquiry",
  general: "General enquiry",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** One line of text with no control characters or repeated spaces. */
function oneLine(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Text that may have line breaks, with line endings tidied up. */
function multiLine(value: string): string {
  return value.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim();
}

function text(input: Record<string, unknown>, key: string): string {
  const v = input[key];
  return typeof v === "string" ? v : "";
}

export function checkContact(input: Record<string, unknown>): Checked<ContactEnquiry> {
  const fields: Record<string, string> = {};

  const rawType = text(input, "type");
  const type = (TYPES as readonly string[]).includes(rawType) ? (rawType as EnquiryType) : null;
  if (!type) fields.type = "Choose what this message is about.";

  const name = oneLine(text(input, "name"));
  if (!name) fields.name = "Please enter your name.";
  else if (name.length > LIMITS.name) fields.name = `Please keep your name under ${LIMITS.name} characters.`;

  const email = text(input, "email").trim();
  if (!email) fields.email = "Please enter your email address.";
  else if (email.length > LIMITS.email || !EMAIL_PATTERN.test(email)) {
    fields.email = "That email address does not look right.";
  }

  const message = multiLine(text(input, "message"));
  if (!message) fields.message = "Please write a message.";
  else if (message.length > LIMITS.message) {
    fields.message = `Please keep your message under ${LIMITS.message} characters.`;
  }

  const destination = oneLine(text(input, "destination"));
  const level = oneLine(text(input, "level"));
  const organisation = oneLine(text(input, "organisation"));
  for (const [key, value] of Object.entries({ destination, level, organisation })) {
    if (value.length > LIMITS.short) fields[key] = `Please keep this under ${LIMITS.short} characters.`;
  }

  if (Object.keys(fields).length > 0 || !type) return { ok: false, fields };

  return {
    ok: true,
    value: {
      type,
      name,
      email,
      message,
      destination: type === "student" ? destination : "",
      level: type === "student" ? level : "",
      organisation: type === "collab" ? organisation : "",
    },
  };
}

export function composeContactEmail(
  enquiry: ContactEnquiry,
  meta: { host: string; at: Date },
): Email {
  const label = TYPE_LABEL[enquiry.type];
  const lines = [`Type: ${label}`, `Name: ${enquiry.name}`, `Email: ${enquiry.email}`];
  if (enquiry.destination) lines.push(`Interested in studying: ${enquiry.destination}`);
  if (enquiry.level) lines.push(`Study level: ${enquiry.level}`);
  if (enquiry.organisation) lines.push(`Organisation or project: ${enquiry.organisation}`);
  lines.push(
    "",
    "Message:",
    enquiry.message,
    "",
    `Sent from the website contact form (${meta.host}) on ${meta.at.toISOString()}`,
    "Reply to this email to answer the visitor directly.",
  );
  return {
    subject: `${label} from ${enquiry.name}`.slice(0, 150),
    text: lines.join("\n"),
    replyTo: enquiry.email,
  };
}
