"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { glide } from "@/lib/glide";
import { icons } from "./icons";
import type { TabIconName } from "./icons";
import styles from "./MobileTabBar.module.scss";

// The phone-only bar at the bottom of the screen, from the designer's Figma
// (HBWebsite/Mobile/Home). Journey and Gallery open screens of their own
// (/journey/ and /gallery/) that hold just that part of the home page. On the
// home page itself their tabs light up while that section is on screen.
type Tab = {
  key: "home" | "services" | "journey" | "stories" | "gallery";
  label: string;
  href: string;
  icon: TabIconName;
  /** The page the tab belongs to. Tapping it while already there scrolls to the top. */
  page: string;
  /** The home page section (its id) that lights this tab up while on screen. */
  section?: "journey" | "gallery";
};

const TABS: Tab[] = [
  { key: "home", label: "Home", href: "/", icon: "home", page: "/" },
  { key: "services", label: "Services", href: "/services", icon: "services", page: "/services" },
  { key: "journey", label: "Journey", href: "/journey", icon: "journey", page: "/journey", section: "journey" },
  { key: "stories", label: "Stories", href: "/stories", icon: "stories", page: "/stories" },
  { key: "gallery", label: "Gallery", href: "/gallery", icon: "gallery", page: "/gallery", section: "gallery" },
];

const SECTIONS = ["journey", "gallery"] as const;

const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

// The glass drop behind the selected tab: how far it reaches past the tab.
const DROP_PAD = 12;

export default function MobileTabBar() {
  // "/services/" and "/services" are the same page.
  const path = (usePathname() ?? "/").replace(/\/+$/, "") || "/";
  const [inSection, setInSection] = useState<Tab["section"] | null>(null);
  // The tab just tapped lights up at once (the page changes a moment later,
  // after the page-change animation). It counts only on the page it was tapped on.
  const [tapped, setTapped] = useState<{ key: Tab["key"]; on: string } | null>(null);
  const barRef = useRef<HTMLElement | null>(null);
  const dropRef = useRef<HTMLSpanElement | null>(null);
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const dropAt = useRef<{ x: number; w: number } | null>(null);

  // On the home page, the Journey and Gallery tabs light up while their section
  // fills the middle of the screen.
  useEffect(() => {
    if (path !== "/") return;
    const onScreen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) onScreen.add(entry.target.id);
          else onScreen.delete(entry.target.id);
        }
        setInSection(SECTIONS.find((id) => onScreen.has(id)) ?? null);
      },
      { rootMargin: "-49% 0px -49% 0px" },
    );
    for (const id of SECTIONS) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => {
      observer.disconnect();
      setInSection(null);
    };
  }, [path]);

  let current: Tab["key"] | null = null;
  if (path === "/") current = inSection ?? "home";
  else if (path.startsWith("/services")) current = "services";
  else if (path.startsWith("/journey")) current = "journey";
  else if (path.startsWith("/stories")) current = "stories";
  else if (path.startsWith("/gallery")) current = "gallery";
  const selected = tapped && tapped.on === path ? tapped.key : current;

  // Move the glass drop to the selected tab: it stretches as it travels, like
  // a drop of water, and settles with a little bounce.
  useEffect(() => {
    const bar = barRef.current;
    const drop = dropRef.current;
    if (!bar || !drop) return;
    const place = (animate: boolean) => {
      const index = TABS.findIndex((tab) => tab.key === selected);
      const tab = index >= 0 ? tabRefs.current[index] : null;
      if (!tab || tab.offsetWidth === 0) {
        drop.style.opacity = "0";
        dropAt.current = null;
        return;
      }
      const next = { x: tab.offsetLeft - DROP_PAD, w: tab.offsetWidth + DROP_PAD * 2 };
      drop.style.opacity = "1";
      glide(drop, animate ? dropAt.current : null, next);
      dropAt.current = next;
    };
    place(true);
    const ro = new ResizeObserver(() => place(false));
    ro.observe(bar);
    return () => ro.disconnect();
  }, [selected]);

  function onTabClick(event: MouseEvent<HTMLAnchorElement>, tab: Tab) {
    // Leave new-tab and modified clicks to the browser.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    // Already on the page: scroll to the top instead of reloading it.
    if (path === tab.page) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: scrollBehavior() });
      return;
    }
    setTapped({ key: tab.key, on: path });
  }

  return (
    <nav ref={barRef} className={styles.bar} aria-label="Quick links" data-glass="top">
      <span ref={dropRef} className={styles.drop} aria-hidden="true" />
      {TABS.map((tab, i) => {
        const icon = icons[tab.icon];
        const active = selected === tab.key;
        return (
          <Link
            key={tab.key}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            href={tab.href}
            className={`${styles.tab} ${active ? styles.active : ""}`}
            aria-current={current === tab.key ? "page" : undefined}
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
