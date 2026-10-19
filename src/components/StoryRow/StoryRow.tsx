import Image from "next/image";
import Link from "next/link";
import { imageUrl } from "@/lib/sanity/image";
import type { Story } from "@/lib/sanity/types";
import styles from "./StoryRow.module.scss";

export default function StoryRow({ story }: { story: Story }) {
  const src = imageUrl(story.photo, { width: 1200 });
  const href = story.linkHref?.trim();
  const external = /^https?:/i.test(href ?? "");

  return (
    <article className={`${styles.row} reveal`}>

      {/* ── Photo — border-radius: 32px 0 0 32px (Figma) ── */}
      <div className={styles.photoWrap}>
        {src && (
          <Image
            src={src}
            alt={story.photo?.alt ?? story.name ?? story.headline}
            fill
            sizes="(max-width: 900px) 100vw, 52vw"
            style={{ objectFit: "cover", objectPosition: "center top" }}
          />
        )}
        <div className={styles.fade} />
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className={styles.content}>

        {/* Frame 186: heading + mint rule */}
        <div className={styles.headingBlock}>
          <h2 className={styles.headline}>{story.headline}</h2>
          <div className={styles.rule} />
        </div>

        {/* Frame 304: body text + link */}
        <div className={styles.bodyBlock}>
          <p className={styles.body}>{story.summary}</p>
          {href && story.linkLabel && (
            external ? (
              <a href={href} className={styles.link} target="_blank" rel="noopener noreferrer">
                {story.linkLabel}
              </a>
            ) : (
              <Link href={href} className={styles.link}>
                {story.linkLabel}
              </Link>
            )
          )}
        </div>
      </div>
    </article>
  );
}
