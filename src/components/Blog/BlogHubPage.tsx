import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import {
  blogPostingJsonLd,
  breadcrumbJsonLd,
  collectionJsonLd,
  faqJsonLd,
  topicPath,
  type Crumb,
} from "@/lib/blog/jsonld";
import type { HubView } from "@/lib/blog/hubView";
import { jsonLdString } from "@/lib/jobs/jsonld";
import type { SiteSettings } from "@/lib/sanity/types";
import BlogArticle from "./BlogArticle";
import { Flag, HubChip } from "./Flag";
import PostCard, { PostLinks } from "./PostCard";
import styles from "./Blog.module.scss";

type Props = { view: HubView; settings: SiteSettings };

// The first posts in the list are cards; the rest are a short list of links,
// so a page with many posts stays easy to scan.
const CARDS = 6;

/**
 * /blog/study-in/<country>/ and /blog/students-from/<country>/: the main guide
 * in full, then more posts, then links to the other kind of page. Without a
 * main guide: a heading, the short description and the list.
 */
export default function BlogHubPage({ view, settings }: Props) {
  const { kind, hub, label, path, guide, posts, listTitle, links, linksTitle, linksLead, topic, guides } = view;
  const cards = posts.slice(0, CARDS);
  const more = posts.slice(CARDS);

  const parents = [
    { href: "/blog/", label: "Blog" },
    ...(topic ? [{ href: topicPath(topic.slug), label: topic.title }] : []),
  ];
  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    ...parents.map((p) => ({ name: p.label, path: p.href })),
    { name: label, path },
  ];
  const faqData = guide ? faqJsonLd(guide) : null;
  const structured = guide
    ? [blogPostingJsonLd(guide, path), breadcrumbJsonLd(crumbs), ...(faqData ? [faqData] : [])]
    : [collectionJsonLd({ name: label, description: hub.intro, path, posts, guides }), breadcrumbJsonLd(crumbs)];
  const jsonLd = (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(structured) }} />
  );

  const linkBlock =
    links.length > 0 ? (
      <nav className={styles.hubLinks} aria-labelledby="hub-links">
        <h2 id="hub-links" className={guide ? styles.sectionTitle : styles.sectionLabel}>
          {linksTitle}
        </h2>
        <p>{linksLead}</p>
        <ul className={styles.chipList}>
          {links.map((l) => (
            <HubChip key={l.path} hub={l} />
          ))}
        </ul>
      </nav>
    ) : null;

  if (guide) {
    return (
      <div className={styles.page}>
        {jsonLd}
        <div className={styles.articleWrap}>
          <Breadcrumb current={label} parents={parents} inset />
          <BlogArticle
            post={guide}
            settings={settings}
            guides={guides}
            flag={hub.flag}
            extraToc={[
              ...(posts.length ? [{ id: "hub-posts", text: listTitle }] : []),
              ...(linkBlock ? [{ id: "hub-links", text: linksTitle }] : []),
            ]}
          />
          {posts.length > 0 && (
            <section className={styles.related} aria-labelledby="hub-posts">
              <h2 id="hub-posts" className={styles.sectionTitle}>
                {listTitle}
              </h2>
              <ul className={styles.gridTwo}>
                {cards.map((p) => (
                  <PostCard key={p._id} post={p} showTopic guides={guides} />
                ))}
              </ul>
              <PostLinks posts={more} guides={guides} />
            </section>
          )}
          {linkBlock}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {jsonLd}
      <Breadcrumb current={label} parents={parents} />

      <header className={styles.hero}>
        <div className="reveal">
          <p className={`${styles.eyebrow} ${styles.eyebrowFlag}`}>
            <Flag code={hub.flag} small />
            {kind === "destination" ? "Study destination" : "Home country"}
          </p>
          <h1>{label}</h1>
          {hub.intro && <p className={styles.lead}>{hub.intro}</p>}
        </div>
      </header>

      <div className={styles.topics}>
        {posts.length > 0 ? (
          <section className={styles.topic} aria-labelledby="hub-posts">
            <h2 id="hub-posts" className={styles.sectionLabel}>
              {listTitle}
            </h2>
            <ul className={styles.grid}>
              {cards.map((p) => (
                <PostCard key={p._id} post={p} showTopic guides={guides} />
              ))}
            </ul>
            <PostLinks posts={more} guides={guides} />
          </section>
        ) : (
          <div className={styles.empty}>
            <h2>This guide is on the way</h2>
            <p>
              We are writing it now. Until then, see <Link href="/blog/">all our guides</Link>, or ask us on a{" "}
              <Link href="/contact/">free call</Link>.
            </p>
          </div>
        )}
        {linkBlock}
      </div>
    </div>
  );
}
