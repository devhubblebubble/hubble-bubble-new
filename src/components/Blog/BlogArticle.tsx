import Link from "next/link";
import { topicPath } from "@/lib/blog/urls.mjs";
import { bodyHeadings, longDate, readingMinutes } from "@/lib/blog/text";
import type { Post, PostPerson, SiteSettings } from "@/lib/sanity/types";
import { Flag } from "./Flag";
import PostBody from "./PostBody";
import styles from "./Blog.module.scss";

type Props = {
  post: Post;
  settings: SiteSettings;
  /** Post slug -> hub address, so links to a hub's main guide go to the hub. */
  guides?: Map<string, string>;
  /** A flag before the topic above the title (on Study in and Students from pages). */
  flag?: string;
  /** More "On this page" entries after the post's own sections (a hub's lists). */
  extraToc?: { id: string; text: string }[];
};

const person = (p: PostPerson | undefined) =>
  p?.name ? [p.name, p.title].filter(Boolean).join(", ") : "";

/**
 * One post as an article: title, dates, "In short", contents, text, questions,
 * sources and the call to book. Used by post pages and by the Study in and
 * Students from pages, which show their main guide this way.
 */
export default function BlogArticle({ post, settings, guides, flag, extraToc = [] }: Props) {
  const headings = bodyHeadings(post.body);
  const toc = [...headings.map((h) => ({ id: h.id, text: h.text })), ...extraToc];
  const minutes = readingMinutes(post.body);
  const keyPoints = (post.keyPoints ?? []).filter(Boolean);
  const faq = (post.faq ?? []).filter((f) => f.question && f.answer);
  const sources = (post.sources ?? []).filter((s) => s.url);
  const author = person(post.author);
  const reviewer = person(post.reviewedBy);
  const bookHref = settings.bookingUrl?.trim() || "/contact/";
  const bookExternal = /^https?:/i.test(bookHref);

  return (
    <article className={styles.article} aria-labelledby="post-title">
      <header className={styles.postHeader}>
        {(post.topic || flag) && (
          <p className={`${styles.eyebrow} ${flag ? styles.eyebrowFlag : ""}`}>
            {flag && <Flag code={flag} small />}
            {post.topic && <Link href={topicPath(post.topic.slug)}>{post.topic.title}</Link>}
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

      {toc.length >= 3 && (
        <nav className={styles.toc} aria-labelledby="on-this-page">
          <h2 id="on-this-page">On this page</h2>
          <ol>
            {toc.map((h) => (
              <li key={h.id}>
                <a href={`#${h.id}`}>{h.text}</a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <PostBody body={post.body} headings={headings} guides={guides} />

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
  );
}
