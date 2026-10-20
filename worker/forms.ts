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

// ── Eligibility check ────────────────────────────────────────────────────────

export type NextStep = "sendEmail" | "bookCall";

export type EligibilityEnquiry = {
  name: string;
  email: string;
  age: string;
  qualification: string;
  contactNumber: string;
  studyStatus: string;
  countries: string[];
  universities: string[];
  nextStep: NextStep;
};

const NEXT_STEP_LABEL: Record<NextStep, string> = {
  sendEmail: "Will email their documents",
  bookCall: "Wants to book a call with a mentor",
};

const MAX_LIST_ITEMS = 10;

function list(input: Record<string, unknown>, key: string, maxEach: number): { items: string[]; tooLong: boolean } {
  const raw = input[key];
  const items: string[] = [];
  let tooLong = false;
  if (Array.isArray(raw)) {
    for (const entry of raw.slice(0, MAX_LIST_ITEMS)) {
      if (typeof entry !== "string") continue;
      const value = oneLine(entry);
      if (!value) continue;
      if (value.length > maxEach) tooLong = true;
      else items.push(value);
    }
  }
  return { items, tooLong };
}

export function checkEligibility(input: Record<string, unknown>): Checked<EligibilityEnquiry> {
  const fields: Record<string, string> = {};

  const name = oneLine(text(input, "name"));
  if (!name) fields.name = "Please enter your name.";
  else if (name.length > LIMITS.name) fields.name = `Please keep your name under ${LIMITS.name} characters.`;

  const email = text(input, "email").trim();
  if (!email) fields.email = "Please enter your email address.";
  else if (email.length > LIMITS.email || !EMAIL_PATTERN.test(email)) {
    fields.email = "That email address does not look right.";
  }

  const age = oneLine(text(input, "age"));
  if (!age) fields.age = "Please enter your age.";
  else if (age.length > 10) fields.age = "That does not look like an age.";

  const qualification = oneLine(text(input, "qualification"));
  if (!qualification) fields.qualification = "Please enter your current qualification.";
  else if (qualification.length > LIMITS.short) fields.qualification = `Please keep this under ${LIMITS.short} characters.`;

  const contactNumber = oneLine(text(input, "contactNumber"));
  if (contactNumber.length < 5) fields.contactNumber = "Please enter a contact number.";
  else if (contactNumber.length > 40) fields.contactNumber = "That number is too long.";

  const studyStatus = oneLine(text(input, "studyStatus"));
  if (!studyStatus) fields.studyStatus = "Please choose your current status.";
  else if (studyStatus.length > LIMITS.short) fields.studyStatus = `Please keep this under ${LIMITS.short} characters.`;

  const countries = list(input, "countries", 40);
  if (countries.items.length === 0 || countries.tooLong) fields.countries = "Please choose at least one country.";

  const universities = list(input, "universities", LIMITS.name);
  if (universities.items.length === 0 || universities.tooLong) fields.universities = "Please enter at least one university.";

  const rawStep = text(input, "nextStep");
  const nextStep = rawStep === "sendEmail" || rawStep === "bookCall" ? rawStep : null;
  if (!nextStep) fields.nextStep = "Please choose how you want to proceed.";

  if (Object.keys(fields).length > 0 || !nextStep) return { ok: false, fields };

  return {
    ok: true,
    value: {
      name,
      email,
      age,
      qualification,
      contactNumber,
      studyStatus,
      countries: countries.items,
      universities: universities.items,
      nextStep,
    },
  };
}

export function composeEligibilityEmail(
  enquiry: EligibilityEnquiry,
  meta: { host: string; at: Date },
): Email {
  const lines = [
    "Type: Eligibility check",
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    `Age: ${enquiry.age}`,
    `Current qualification: ${enquiry.qualification}`,
    `Contact number: ${enquiry.contactNumber}`,
    `Status in the study abroad process: ${enquiry.studyStatus}`,
    `Preferred countries: ${enquiry.countries.join(", ")}`,
    `Preferred universities: ${enquiry.universities.join("; ")}`,
    `Next step they chose: ${NEXT_STEP_LABEL[enquiry.nextStep]}`,
    "",
    `Sent from the website eligibility check (${meta.host}) on ${meta.at.toISOString()}`,
    "Reply to this email to answer the visitor directly.",
  ];
  return {
    subject: `Eligibility check from ${enquiry.name}`.slice(0, 150),
    text: lines.join("\n"),
    replyTo: enquiry.email,
  };
}
