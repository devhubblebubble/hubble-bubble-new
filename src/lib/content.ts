/**
 * Page text from Sanity, with the built-in text for anything left empty in
 * the Studio: an empty or missing field (or an empty list) shows the default,
 * so a page never has a blank heading or button.
 */
export function withDefaults<T extends Record<string, unknown>>(
  defaults: T,
  data: Partial<Record<keyof T, unknown>> | null | undefined,
): T {
  const out = { ...defaults };
  if (!data) return out;
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const value = data[key];
    if (typeof value === "string" ? value.trim() !== "" : Array.isArray(value) ? value.length > 0 : value != null) {
      out[key] = value as T[keyof T];
    }
  }
  return out;
}
