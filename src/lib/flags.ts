// Country flags for the student cards. Editors type a 2-letter country code
// ("GB") or paste an emoji flag; either becomes an SVG flag served from
// /images/flags (copied from the flag-icons package at build time by
// scripts/copy-flags.mjs). Emoji flags alone are not enough: Windows shows
// them as two letters, which is why the badge read "GB" on desktop.

const REGIONAL_A = 0x1f1e6; // 🇦
const REGIONAL_Z = 0x1f1ff; // 🇿

// Common ways of writing the UK nations and the UK.
const ALIASES: Record<string, string> = {
  UK: "GB",
  ENGLAND: "GB-ENG",
  SCOTLAND: "GB-SCT",
  WALES: "GB-WLS",
  "GB-ENG": "GB-ENG",
  "GB-SCT": "GB-SCT",
  "GB-WLS": "GB-WLS",
  "GB-NIR": "GB-NIR",
};

let regionNames: Intl.DisplayNames | undefined;
const nameOf = (code: string): string | undefined => {
  try {
    regionNames ??= new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });
    return regionNames.of(code) ?? undefined;
  } catch {
    return undefined;
  }
};

/** "GB", "gb", "🇬🇧" or "UK" -> "GB" (the flag file name); undefined if it is not a real country. */
export function countryCode(input: string | undefined): string | undefined {
  const s = input?.trim();
  if (!s) return undefined;

  const plain = s.toUpperCase();
  if (ALIASES[plain]) return ALIASES[plain];

  let code: string | undefined;
  if (/^[A-Z]{2}$/.test(plain)) {
    code = plain;
  } else {
    const points = Array.from(s).map((c) => c.codePointAt(0) ?? 0);
    if (points.length === 2 && points.every((p) => p >= REGIONAL_A && p <= REGIONAL_Z)) {
      code = points.map((p) => String.fromCharCode(65 + (p - REGIONAL_A))).join("");
    }
  }
  // Only real countries: "XX", "ZZ" or a typo would otherwise point at a flag file that does not exist.
  const name = code ? nameOf(code) : undefined;
  return code && name && name !== nameOf("ZZ") ? code : undefined;
}

/** Path of the flag image for a code from countryCode(). */
export const flagSrc = (code: string) => `/images/flags/${code.toLowerCase()}.svg`;

const UK_NATIONS: Record<string, string> = {
  "GB-ENG": "England",
  "GB-SCT": "Scotland",
  "GB-WLS": "Wales",
  "GB-NIR": "Northern Ireland",
};

/** "GB" -> "United Kingdom" (falls back to the code). */
export const countryName = (code: string): string => UK_NATIONS[code] ?? nameOf(code) ?? code;
