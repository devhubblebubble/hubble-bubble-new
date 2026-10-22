import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { breadcrumbJsonLd, collectionJsonLd } from "@/lib/blog/jsonld";
import { byRegion, isReady } from "@/lib/blog/hubs.mjs";
import { destinationPath, originPath, topicPath } from "@/lib/blog/urls.mjs";
import { jsonLdString } from "@/lib/jobs/jsonld";
import type { BlogDestination, BlogOrigin, BlogTopic, Post } from "@/lib/sanity/types";
import { Flag, HubChip } from "./Flag";
import PostCard, { PostLinks } from "./PostCard";
import styles from "./Blog.module.scss";

export const BLOG_TITLE = "Study abroad guides";
export const BLOG_LEAD =
  "Straight answers for international students, checked against official sources. Start with where you want to study, where you are from, or a topic.";

// The topics whose guides are shown as Study in and Students from pages here.
const DESTINATION_TOPIC = "destinations";
const HOME_COUNTRY_TOPIC = "home-country";

type Props = {
  topics: BlogTopic[];
  posts: Post[];
  destinations: BlogDestination[];
  origins: BlogOrigin[];
  /** Post slug -> hub address, for every post that is a hub's main guide. */
  guides: Map<string, string>;
};

/**
 * /blog/: three ways in. Where you want to study (Study in pages), where you
 * are from (Students from pages, by region), and every other post by topic.
 */
export default function BlogIndex({ topics, posts, destinations, origins, guides }: Props) {
  const ready = { destinations: destinations.filter(isReady), origins: origins.filter(isReady) };
  const inTopic = (slug: string) => posts.filter((p) => p.topic?.slug === slug);
  // Posts in the two country topics that are not a page's main guide (a country
  // without its own page, say). They are listed under their way in.
  const moreCountryGuides = inTopic(DESTINATION_TOPIC).filter((p) => !guides.has(p.slug));
  const moreHomeCountry = inTopic(HOME_COUNTRY_TOPIC).filter((p) => !guides.has(p.slug));
  const topicOf = (slug: string) => topics.find((t) => t.slug === slug && inTopic(slug).length > 0);
  const destinationTopic = topicOf(DESTINATION_TOPIC);
  const homeCountryTopic = topicOf(HOME_COUNTRY_TOPIC);

  const groups = topics
    .filter((t) => t.slug !== DESTINATION_TOPIC && t.slug !== HOME_COUNTRY_TOPIC)
    .map((topic) => ({ topic, posts: inTopic(topic.slug) }))
    .filter((g) => g.posts.length > 0);
  // Posts whose topic was deleted still show, at the end.
  const loose = posts.filter((p) => !p.topic || !topics.some((t) => t.slug === p.topic?.slug));

  const showStudyIn = ready.destinations.length > 0 || moreCountryGuides.length > 0;
  const showFrom = ready.origins.length > 0 || moreHomeCountry.length > 0;
  const jumps = [
    ...(showStudyIn ? [{ href: "#study-in", label: "Where to study" }] : []),
    ...(showFrom ? [{ href: "#students-from", label: "Where you are from" }] : []),
    ...(groups.length ? [{ href: "#topics", label: "Guides by topic" }] : []),
  ];

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString([
            collectionJsonLd({ name: BLOG_TITLE, description: BLOG_LEAD, path: "/blog/", posts, guides }),
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
          {jumps.length > 1 && (
            <nav className={styles.chips} aria-label="Ways in">
              {jumps.map((j) => (
                <a key={j.href} href={j.href} className={styles.chip}>
                  {j.label}
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

        {showStudyIn && (
          <section id="study-in" className={styles.topic} aria-labelledby="study-in-title">
            <div className={styles.topicHead}>
              <h2 id="study-in-title">Where do you want to study?</h2>
              <p>Each guide covers visas, costs, applying and work after study.</p>
            </div>
            {ready.destinations.length > 0 && (
              <ul className={styles.hubGrid}>
                {ready.destinations.map((d) => (
                  <li key={d.slug} className={styles.hubTile} data-glass="flat">
                    <Link href={destinationPath(d.slug)}>
                      <Flag code={d.flag} />
                      <span>{d.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {moreCountryGuides.length > 0 && (
              <div className={styles.subGroup}>
                <h3 className={styles.subLabel}>More country guides</h3>
                <PostLinks posts={moreCountryGuides} guides={guides} />
              </div>
            )}
            {destinationTopic && (
              <Link href={topicPath(destinationTopic.slug)} className={styles.topicLink}>
                All country guides <span aria-hidden="true">›</span>
              </Link>
            )}
          </section>
        )}

        {showFrom && (
          <section id="students-from" className={styles.topic} aria-labelledby="students-from-title">
            <div className={styles.topicHead}>
              <h2 id="students-from-title">Where are you from?</h2>
              <p>Visa steps, documents, money and scholarships that depend on your home country.</p>
            </div>
            {ready.origins.length > 0 && (
              <div className={styles.regions}>
                {byRegion(ready.origins).map((group) => (
                  <div key={group.region} className={styles.region}>
                    <h3>{group.title}</h3>
                    <ul className={styles.chipList}>
                      {group.hubs.map((o) => (
                        <HubChip key={o.slug} hub={{ path: originPath(o.slug), name: o.name, flag: o.flag }} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {moreHomeCountry.length > 0 && (
              <div className={styles.subGroup}>
                <h3 className={styles.subLabel}>More advice by home country</h3>
                <PostLinks posts={moreHomeCountry} guides={guides} />
              </div>
            )}
            {homeCountryTopic && (
              <Link href={topicPath(homeCountryTopic.slug)} className={styles.topicLink}>
                All home-country guides <span aria-hidden="true">›</span>
              </Link>
            )}
          </section>
        )}

        {groups.length > 0 && (
          <section id="topics" className={styles.topic} aria-labelledby="topics-title">
            <div className={styles.topicHead}>
              <h2 id="topics-title">Guides by topic</h2>
              <p>Guides for students from any country, by topic.</p>
            </div>
            {groups.length > 1 && (
              <nav className={`${styles.chips} ${styles.chipsStart}`} aria-label="Topics">
                {groups.map(({ topic, posts: list }) => (
                  <a key={topic.slug} href={`#${topic.slug}`} className={styles.chip}>
                    {topic.title} <span className={styles.chipCount}>{list.length}</span>
                  </a>
                ))}
              </nav>
            )}
            <div className={styles.topicGroups}>
              {groups.map(({ topic, posts: list }) => (
                <div key={topic.slug} id={topic.slug} className={styles.topic}>
                  <div className={styles.topicHead}>
                    <h3 id={`topic-${topic.slug}`}>{topic.title}</h3>
                    {topic.description && <p>{topic.description}</p>}
                  </div>
                  <ul className={styles.grid}>
                    {list.map((post) => (
                      <PostCard key={post._id} post={post} guides={guides} level={4} />
                    ))}
                  </ul>
                  <Link href={topicPath(topic.slug)} className={styles.topicLink}>
                    {topic.title}: all guides <span aria-hidden="true">›</span>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {loose.length > 0 && (
          <section className={styles.topic} aria-labelledby="topic-more">
            <div className={styles.topicHead}>
              <h2 id="topic-more">More guides</h2>
            </div>
            <ul className={styles.grid}>
              {loose.map((post) => (
                <PostCard key={post._id} post={post} guides={guides} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
