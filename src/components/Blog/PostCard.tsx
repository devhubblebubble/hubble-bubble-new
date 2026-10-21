import Link from "next/link";
import { postPath } from "@/lib/blog/jsonld";
import type { Post, PostLink } from "@/lib/sanity/types";
import styles from "./Blog.module.scss";

type Props = {
  post: Post | PostLink;
  /** Show the post's topic above the title (used where posts from several topics mix). */
  showTopic?: boolean;
  /** Bigger card for a topic's main guide. */
  large?: boolean;
};

/** A post as a card in a list. The whole card is the link. */
export default function PostCard({ post, showTopic = false, large = false }: Props) {
  const topic = showTopic ? post.topic?.title : undefined;
  return (
    <li className={`${styles.card} ${large ? styles.cardLarge : ""} reveal`} data-glass="flat">
      <article aria-labelledby={`card-${post.slug}`}>
        {(post.pillar || topic) && (
          <p className={styles.cardEyebrow}>
            {post.pillar && <span className={styles.tagMain}>Main guide</span>}
            {topic && <span className={styles.cardTopic}>{topic}</span>}
          </p>
        )}
        <h3 id={`card-${post.slug}`} className={styles.cardTitle}>
          <Link href={postPath(post.slug)}>{post.title}</Link>
        </h3>
        {post.excerpt && <p className={styles.cardText}>{post.excerpt}</p>}
        <span className={styles.cardMore} aria-hidden="true">
          Read the guide <span>›</span>
        </span>
      </article>
    </li>
  );
}
