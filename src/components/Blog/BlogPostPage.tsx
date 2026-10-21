import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { blogPostingJsonLd, breadcrumbJsonLd, faqJsonLd, postPath, topicPath, type Crumb } from "@/lib/blog/jsonld";
import { bodyHeadings, longDate, readingMinutes } from "@/lib/blog/text";
import { jsonLdString } from "@/lib/jobs/jsonld";
import type { Post, PostLink, PostPerson, SiteSettings } from "@/lib/sanity/types";
import PostBody from "./PostBody";
import PostCard from "./PostCard";
import styles from "./Blog.module.scss";

type Props = { post: Post; settings: SiteSettings };

const person = (p: PostPerson | undefined) =>
  p?.name ? [p.name, p.title].filter(Boolean).join(", ") : "";

export default function BlogPostPage({ post, settings }: Props) {
  const headings = bodyHeadings(post.body);
  const minutes = readingMinutes(post.body);
  const keyPoints = (post.keyPoints ?? []).filter(Boolean);
  const faq = (post.faq ?? []).filter((f) => f.question && f.answer);
  const sources = (post.sources ?? []).filter((s) => s.url);
  const related = (post.related ?? []).filter((r): r is PostLink => Boolean(r));
  const author = person(post.author);
  const reviewer = person(post.reviewedBy);
  const bookHref = settings.bookingUrl?.trim() || "/contact/";
  const bookExternal = /^https?:/i.test(bookHref);

  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog/" },
    ...(post.topic ? [{ name: post.topic.title, path: topicPath(post.topic.slug) }] : []),
    { name: post.title, path: postPath(post.slug) },
  ];
  const faqData = faqJsonLd(post);
  const structured = [blogPostingJsonLd(post), breadcrumbJsonLd(crumbs), ...(faqData ? [faqData] : [])];

  return (
    <div className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(structured) }} />

      <div className={styles.articleWrap}>
        <Breadcrumb
          current={post.title}
          parents={[
            { href: "/blog/", label: "Blog" },
            ...(post.topic ? [{ href: topicPath(post.topic.slug), label: post.topic.title }] : []),
          ]}
          inset
        />

        <article className={styles.article} aria-labelledby="post-title">
          <header className={styles.postHeader}>
            {post.topic && (
              <p className={styles.eyebrow}>
                <Link href={topicPath(post.topic.slug)}>{post.topic.title}</Link>
              </p>
            )}
            <h1 id="post-title" className={styles.postTitle}>
              {post.title}
            </h1>
            <p className={styles.meta}>
              {post.reviewedAt && (
                <>
                  Last checked <time dateTime={post.reviewedAt}>{longDate(post.reviewedAt)}</time>
                  <span aria-hidden="true"> · </span>
                </>
              )}
              {minutes} min read
            </p>
            <p className={styles.byline}>
              {author ? `By ${author}` : "By the Hubble Bubble team"}
              {reviewer && (
                <>
                  <span aria-hidden="true"> · </span>
                  Reviewed by {reviewer}
                </>
              )}
            </p>
          </header>

          {keyPoints.length > 0 && (
            <aside className={styles.inShort} aria-labelledby="in-short">
              <h2 id="in-short">In short</h2>
              <ul>
                {keyPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </aside>
          )}

          {headings.length >= 3 && (
            <nav className={styles.toc} aria-labelledby="on-this-page">
              <h2 id="on-this-page">On this page</h2>
              <ol>
                {headings.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`}>{h.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <PostBody body={post.body} headings={headings} />

          {faq.length > 0 && (
            <section className={styles.faq} aria-labelledby="faq">
              <h2 id="faq" className={styles.sectionTitle}>
                Questions people ask
              </h2>
              {faq.map((item) => (
                <div key={item._key ?? item.question} className={styles.faqItem}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </div>
              ))}
            </section>
          )}

          {sources.length > 0 && (
            <section className={styles.sources} aria-labelledby="sources">
              <h2 id="sources" className={styles.sectionTitle}>
                Sources
              </h2>
              <ol>
                {sources.map((s) => (
                  <li key={s._key ?? s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title || s.url}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className={styles.ctaBox} aria-labelledby="book-a-call">
            <h2 id="book-a-call">Want a second opinion on your plan?</h2>
            <p>Our guidance calls are free for students.</p>
            <a
              href={bookHref}
              className={styles.ctaButton}
              target={bookExternal ? "_blank" : undefined}
              rel={bookExternal ? "noopener noreferrer" : undefined}
            >
              Book a free call
              {bookExternal && <span className="sr-only"> (opens in a new tab)</span>}
            </a>
          </section>
        </article>

        {related.length > 0 && (
          <section className={styles.related} aria-labelledby="read-next">
            <h2 id="read-next" className={styles.sectionTitle}>
              Read next
            </h2>
            <ul className={styles.gridTwo}>
              {related.map((r) => (
                <PostCard key={r._id} post={r} showTopic />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
