import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { breadcrumbJsonLd, collectionJsonLd, topicPath } from "@/lib/blog/jsonld";
import { jsonLdString } from "@/lib/jobs/jsonld";
import type { BlogTopic, Post } from "@/lib/sanity/types";
import PostCard from "./PostCard";
import styles from "./Blog.module.scss";

export const BLOG_TITLE = "Study abroad guides";
export const BLOG_LEAD =
  "Straight answers for international students, checked against official sources. Pick the topic you need.";

type Props = { topics: BlogTopic[]; posts: Post[] };

export default function BlogIndex({ topics, posts }: Props) {
  const groups = topics
    .map((topic) => ({ topic, posts: posts.filter((p) => p.topic?.slug === topic.slug) }))
    .filter((g) => g.posts.length > 0);
  // Posts whose topic was deleted still show, at the end.
  const loose = posts.filter((p) => !p.topic || !topics.some((t) => t.slug === p.topic?.slug));

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString([
            collectionJsonLd({ name: BLOG_TITLE, description: BLOG_LEAD, path: "/blog/", posts }),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog/" },
            ]),
          ]),
        }}
      />
      <Breadcrumb current="Blog" />

      <header className={styles.hero}>
        <div className="reveal">
          <p className={styles.eyebrow}>Blog</p>
          <h1>{BLOG_TITLE}</h1>
          <p className={styles.lead}>{BLOG_LEAD}</p>
          {groups.length > 1 && (
            <nav className={styles.chips} aria-label="Topics">
              {groups.map(({ topic, posts: list }) => (
                <a key={topic.slug} href={`#${topic.slug}`} className={styles.chip}>
                  {topic.title} <span className={styles.chipCount}>{list.length}</span>
                </a>
              ))}
            </nav>
          )}
        </div>
      </header>

      <div className={styles.topics}>
        {posts.length === 0 && (
          <div className={styles.empty}>
            <h2>New guides are on the way</h2>
            <p>
              We are writing the first guides now. Until then, ask us anything on a{" "}
              <Link href="/contact/">free call</Link>.
            </p>
          </div>
        )}

        {groups.map(({ topic, posts: list }) => (
          <section key={topic.slug} id={topic.slug} className={styles.topic} aria-labelledby={`topic-${topic.slug}`}>
            <div className={styles.topicHead}>
              <h2 id={`topic-${topic.slug}`}>{topic.title}</h2>
              {topic.description && <p>{topic.description}</p>}
            </div>
            <ul className={styles.grid}>
              {list.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </ul>
            <Link href={topicPath(topic.slug)} className={styles.topicLink}>
              {topic.title}: all guides <span aria-hidden="true">›</span>
            </Link>
          </section>
        ))}

        {loose.length > 0 && (
          <section className={styles.topic} aria-labelledby="topic-more">
            <div className={styles.topicHead}>
              <h2 id="topic-more">More guides</h2>
            </div>
            <ul className={styles.grid}>
              {loose.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
