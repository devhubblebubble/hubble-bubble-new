"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { icons } from "./icons";
import type { TabIconName } from "./icons";
import styles from "./MobileTabBar.module.scss";

// The phone-only bar at the bottom of the screen, from the designer's Figma
// (HBWebsite/Mobile/Home). The Figma also has a Gallery tab; there is no
// Gallery page on the site yet, so it is left out.
type Tab = {
  key: "home" | "services" | "journey" | "stories";
  label: string;
  href: string;
  icon: TabIconName;
  /** The page the tab belongs to. Tapping it while already there scrolls to the top. */
  page: string;
};

const TABS: Tab[] = [
  { key: "home", label: "Home", href: "/", icon: "home", page: "/" },
  { key: "services", label: "Services", href: "/services", icon: "services", page: "/services" },
  { key: "journey", label: "Journey", href: "/#journey", icon: "journey", page: "/" },
  { key: "stories", label: "Stories", href: "/stories", icon: "stories", page: "/stories" },
];

const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

export default function MobileTabBar() {
  // "/services/" and "/services" are the same page.
  const path = (usePathname() ?? "/").replace(/\/+$/, "") || "/";
  const [inJourney, setInJourney] = useState(false);

  // On the home page, the Journey tab lights up while that section fills the
  // middle of the screen.
  useEffect(() => {
    if (path !== "/") return;
    const section = document.getElementById("journey");
    if (!section) return;
    const observer = new IntersectionObserver(
      (entries) => setInJourney(entries.some((entry) => entry.isIntersecting)),
      { rootMargin: "-49% 0px -49% 0px" },
    );
    observer.observe(section);
    return () => {
      observer.disconnect();
      setInJourney(false);
    };
  }, [path]);

  let current: Tab["key"] | null = null;
  if (path === "/") current = inJourney ? "journey" : "home";
  else if (path.startsWith("/services")) current = "services";
  else if (path.startsWith("/stories")) current = "stories";

  function onTabClick(event: MouseEvent<HTMLAnchorElement>, tab: Tab) {
    // Leave new-tab and modified clicks to the browser.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    // Already on the page: scroll instead of reloading it.
    if (path === tab.page) {
      if (tab.key === "journey") {
        const section = document.getElementById("journey");
        if (!section) return;
        event.preventDefault();
        section.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
      } else {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: scrollBehavior() });
      }
    }
  }

  return (
    <nav className={styles.bar} aria-label="Quick links">
      {TABS.map((tab) => {
        const icon = icons[tab.icon];
        const active = current === tab.key;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`${styles.tab} ${active ? styles.active : ""}`}
            aria-current={active ? "page" : undefined}
            // On its own page a tab only scrolls, so the page-change animation
            // (TransitionProvider) must not take the tap.
            data-transition-ignore={path === tab.page ? "true" : undefined}
            onClick={(event) => onTabClick(event, tab)}
          >
            <svg
              className={styles.icon}
              width={icon.w}
              height={icon.h}
              viewBox={`0 0 ${icon.w} ${icon.h}`}
              aria-hidden="true"
              focusable="false"
            >
              <path d={icon.d} fill="currentColor" fillRule="evenodd" />
            </svg>
            <span className={styles.label}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
