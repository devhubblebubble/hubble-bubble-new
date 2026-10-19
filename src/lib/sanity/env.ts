// Sanity project settings. The project ID and dataset name are public (they
// appear in every API URL), so they can live in code. Environment variables
// override them, which lets a preview build point at another dataset.

export const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() || "qstbrsll";

export const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";

export const apiVersion = "2025-02-19";

// Set SANITY_OFFLINE=1 to build from content/seed/*.json instead of the live
// dataset. Only for test builds on machines that cannot reach Sanity; the
// Cloudflare build never sets it.
export const offline = process.env.SANITY_OFFLINE === "1";
