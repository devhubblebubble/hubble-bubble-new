import Link from "next/link";
import { postHref } from "@/lib/blog/urls.mjs";
import type { Post, PostLink } from "@/lib/sanity/types";
import styles from "./Blog.module.scss";

type Props = {
  post: Post | PostLink;
  /** Show the post's topic above the title (used where posts from several topics mix). */
  showTopic?: boolean;
  /** Bigger card for a topic's main guide. */
  large?: boolean;
  /** Post slug -> hub address: a hub's main guide links to the hub. */
  guides?: Map<string, string>;
  /** Heading level of the title: h4 where the list sits under an h3. */
  level?: 3 | 4;
};

/** A post as a card in a list. The whole card is the link. */
export default function PostCard({ post, showTopic = false, large = false, guides, level = 3 }: Props) {
  const topic = showTopic ? post.topic?.title : undefined;
  const Title = level === 4 ? "h4" : "h3";
  return (
    <li className={`${styles.card} ${large ? styles.cardLarge : ""} reveal`} data-glass="flat">
      <article aria-labelledby={`card-${post.slug}`}>
        {(post.pillar || topic) && (
          <p className={styles.cardEyebrow}>
            {post.pillar && <span className={styles.tagMain}>Main guide</span>}
            {topic && <span className={styles.cardTopic}>{topic}</span>}
          </p>
        )}
        <Title id={`card-${post.slug}`} className={styles.cardTitle}>
          <Link href={postHref(post.slug, guides)}>{post.title}</Link>
        </Title>
        {post.excerpt && <p className={styles.cardText}>{post.excerpt}</p>}
        <span className={styles.cardMore} aria-hidden="true">
          Read the guide <span>›</span>
        </span>
      </article>
    </li>
  );
}

/** Posts as a short list of links: for the rest of a long list, after the cards. */
export function PostLinks({ posts, guides }: { posts: (Post | PostLink)[]; guides?: Map<string, string> }) {
  if (posts.length === 0) return null;
  return (
    <ul className={styles.linkList}>
      {posts.map((post) => (
        <li key={post._id}>
          <Link href={postHref(post.slug, guides)}>
            {post.title}
            <span aria-hidden="true">›</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
