import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { breadcrumbJsonLd, collectionJsonLd, topicCrumbs, topicPath } from "@/lib/blog/jsonld";
import { jsonLdString } from "@/lib/jobs/jsonld";
import type { BlogTopic, Post } from "@/lib/sanity/types";
import PostCard from "./PostCard";
import styles from "./Blog.module.scss";

type Props = {
  topic: BlogTopic;
  posts: Post[];
  topics: BlogTopic[];
  /** Post slug -> hub address, so a hub's main guide links to the hub. */
  guides?: Map<string, string>;
};

export default function BlogTopicPage({ topic, posts, topics, guides }: Props) {
  const main = posts.find((p) => p.pillar);
  const others = posts.filter((p) => p !== main);
  const otherTopics = topics.filter((t) => t.slug !== topic.slug);

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString([
            collectionJsonLd({
              name: topic.title,
              description: topic.description,
              path: topicPath(topic.slug),
              posts,
              guides,
            }),
            breadcrumbJsonLd(topicCrumbs(topic)),
          ]),
        }}
      />
      <Breadcrumb current={topic.title} parents={[{ href: "/blog/", label: "Blog" }]} />

      <header className={styles.hero}>
        <div className="reveal">
          <p className={styles.eyebrow}>Study abroad guides</p>
          <h1>{topic.title}</h1>
          {topic.description && <p className={styles.lead}>{topic.description}</p>}
          {topic.intro && <p className={styles.intro}>{topic.intro}</p>}
        </div>
      </header>

      <div className={styles.topics}>
        {posts.length === 0 && (
          <div className={styles.empty}>
            <h2>No guides here yet</h2>
            <p>
              The first guides for this topic are being written. See the <Link href="/blog/">other topics</Link>, or
              ask us on a <Link href="/contact/">free call</Link>.
            </p>
          </div>
        )}

        {main && (
          <section className={styles.topic} aria-labelledby="start-here">
            <h2 id="start-here" className={styles.sectionLabel}>
              Start here
            </h2>
            <ul className={styles.gridOne}>
              <PostCard post={main} large guides={guides} />
            </ul>
          </section>
        )}

        {others.length > 0 && (
          <section className={styles.topic} aria-labelledby="more-guides">
            <h2 id="more-guides" className={styles.sectionLabel}>
              {main ? "More guides" : "Guides"}
            </h2>
            <ul className={styles.grid}>
              {others.map((post) => (
                <PostCard key={post._id} post={post} guides={guides} />
              ))}
            </ul>
          </section>
        )}

        {otherTopics.length > 0 && (
          <nav className={styles.otherTopics} aria-labelledby="other-topics">
            <h2 id="other-topics" className={styles.sectionLabel}>
              Other topics
            </h2>
            <ul className={styles.chipList}>
              {otherTopics.map((t) => (
                <li key={t.slug}>
                  <Link href={topicPath(t.slug)} className={styles.chip}>
                    {t.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
