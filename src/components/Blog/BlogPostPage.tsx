import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { blogPostingJsonLd, breadcrumbJsonLd, faqJsonLd, postPath, topicPath, type Crumb } from "@/lib/blog/jsonld";
import { jsonLdString } from "@/lib/jobs/jsonld";
import type { Post, PostLink, SiteSettings } from "@/lib/sanity/types";
import BlogArticle from "./BlogArticle";
import PostCard from "./PostCard";
import styles from "./Blog.module.scss";

type Props = {
  post: Post;
  settings: SiteSettings;
  /** Post slug -> hub address, so links to a hub's main guide go to the hub. */
  guides?: Map<string, string>;
};

/** /blog/<post>/: the article, then "Read next". */
export default function BlogPostPage({ post, settings, guides }: Props) {
  const related = (post.related ?? []).filter((r): r is PostLink => Boolean(r));

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

        <BlogArticle post={post} settings={settings} guides={guides} />

        {related.length > 0 && (
          <section className={styles.related} aria-labelledby="read-next">
            <h2 id="read-next" className={styles.sectionTitle}>
              Read next
            </h2>
            <ul className={styles.gridTwo}>
              {related.map((r) => (
                <PostCard key={r._id} post={r} showTopic guides={guides} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
