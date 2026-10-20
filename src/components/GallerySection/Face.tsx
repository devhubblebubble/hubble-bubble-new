import Image from "next/image";
import { icons } from "@/components/MobileTabBar/icons";
import { imageDims, imageUrl } from "@/lib/sanity/image";
import type { GalleryColor, GalleryItem } from "@/lib/sanity/types";
import styles from "./GallerySection.module.scss";

export const tone = (color?: GalleryColor) => styles[`tone_${color ?? "navy"}`];

/** Short text ("in") is drawn big, a long name smaller, so it always fits the circle. */
export const textSize = (text: string) =>
  text.length <= 2 ? "xl" : text.length <= 5 ? "l" : text.length <= 10 ? "m" : "s";

export function Trophy() {
  return (
    <svg className={styles.icon} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M18 8h28v14c0 9-6 16-14 16s-14-7-14-16V8z" fill="currentColor" />
      <path
        d="M18 13H9v4c0 7 4 11 10 12M46 13h9v4c0 7-4 11-10 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="29" y="37" width="6" height="11" fill="currentColor" />
      <rect x="20" y="48" width="24" height="7" rx="2" fill="currentColor" />
    </svg>
  );
}

export function Handshake() {
  const { d, w, h } = icons.services;
  return (
    <svg className={styles.icon} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
      <path d={d} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

/** The picture standing in for a photo that has not been uploaded yet. */
export const Stand = ({ icon }: { icon?: GalleryItem["icon"] }) =>
  icon === "handshake" ? <Handshake /> : <Trophy />;

/** What fills a bubble: a photo, a logo, short text, or a picture while a photo is missing. */
export default function Face({ item }: { item: GalleryItem }) {
  const src = imageUrl(item.image, { width: 480 });

  if (item.style === "photo") {
    if (src) {
      return (
        <Image
          className={styles.photo}
          src={src}
          alt=""
          fill
          sizes="(max-width: 640px) 120px, 240px"
          draggable={false}
        />
      );
    }
    return <Stand icon={item.icon} />;
  }
  if (src) {
    const dims = imageDims(item.image, { width: 360, height: 200 });
    return (
      <Image
        className={styles.logo}
        src={src}
        alt=""
        width={dims.width}
        height={dims.height}
        draggable={false}
      />
    );
  }
  const text = item.bubbleText?.trim() || item.name || "";
  return (
    <span className={styles.bubbleText} data-size={textSize(text)}>
      {text}
    </span>
  );
}
