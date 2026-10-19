import { createClient } from "@sanity/client";
import { apiVersion, dataset, projectId } from "./env";

// Build-time reads of published content only. No token is needed because the
// dataset is public. useCdn is off so every build sees the latest publish.
export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: "published",
});
