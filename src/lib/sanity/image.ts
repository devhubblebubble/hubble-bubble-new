import { createImageUrlBuilder } from "@sanity/image-url";
import { dataset, projectId } from "./env";
import type { SanityImage } from "./types";

const builder = createImageUrlBuilder({ projectId, dataset });

type Size = { width: number; height?: number; quality?: number };

/**
 * URL for an image at a given size. Live content comes from Sanity's image
 * CDN, which resizes and compresses on the fly (auto WebP/AVIF). The offline
 * fixture points at files under /public.
 */
export function imageUrl(image: SanityImage | undefined, size: Size): string | undefined {
  if (!image) return undefined;
  if (image._localSrc) return image._localSrc;
  if (!image.asset?._ref) return image.url;

  let b = builder.image(image).width(size.width).auto("format").quality(size.quality ?? 82);
  b = size.height ? b.height(size.height).fit("crop") : b.fit("max");
  return b.url();
}

/** Intrinsic size (from the asset metadata), or a fallback. */
export function imageDims(image: SanityImage | undefined, fallback: { width: number; height: number }) {
  if (image?.width && image?.height) return { width: image.width, height: image.height };
  return fallback;
}
