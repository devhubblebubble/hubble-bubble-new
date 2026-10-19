"use client";

import { useState } from "react";
import StoryRow from "@/components/StoryRow/StoryRow";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import type { Story } from "@/lib/sanity/types";
import styles from "./StoriesPage.module.scss";

// All stories render into the HTML when there are 8 or fewer, so crawlers see them.
const PER_PAGE = 8;

type Props = { title?: string; stories: Story[] };

export default function StoriesPage({ title, stories: allStories }: Props) {
  const totalPages = Math.max(1, Math.ceil(allStories.length / PER_PAGE));
  const [page, setPage] = useState(1);
  const stories = allStories.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const goTo = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={styles.page}>

      <Breadcrumb current="Stories" inset />

      {/* Title */}
      <h1 className={styles.title}>{title ?? "Stories"}</h1>

      {/* Story rows — reusable StoryRow component */}
      <div className={styles.list}>
        {stories.map((s) => (
          <StoryRow key={s._id} story={s} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className={styles.pagination} aria-label="Pages">
          <button
            className={styles.pageArrow}
            onClick={() => goTo(Math.max(1, page - 1))}
            disabled={page === 1}
            aria-label="Previous page"
          >
            ‹
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`}
              onClick={() => goTo(p)}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          ))}

          <button
            className={styles.pageArrow}
            onClick={() => goTo(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            ›
          </button>
        </nav>
      )}
    </div>
  );
}
