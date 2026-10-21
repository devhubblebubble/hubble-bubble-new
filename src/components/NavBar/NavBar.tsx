"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import type { KeyboardEvent, ReactElement, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { icons } from "@/components/MobileTabBar/icons";
import { glide } from "@/lib/glide";
import type { Spot } from "@/lib/glide";
import styles from "./NavBar.module.scss";

// How far the hover pill reaches past a link, in px.
const PILL_PAD = 14;

const NAV_LINKS = [
  { href: "/services",    label: "Services" },
  { href: "/recruitment", label: "Jobs"     },
  { href: "/stories",     label: "Stories"  },
  { href: "/about",       label: "About us" },
];

// The phone menu: a glass drawer that slides in from the left, like the old
// site's. Every page gets a line with a small picture.
type MenuItem = { href: string; label: string; icon: ReactElement };

const Icon = ({ d, w, h }: { d: string; w: number; h: number }) => (
  <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
    <path d={d} fill="currentColor" fillRule="evenodd" />
  </svg>
);

const Stroke = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {children}
  </svg>
);

const MENU: MenuItem[] = [
  { href: "/", label: "Home", icon: <Icon {...icons.home} /> },
  { href: "/services", label: "Services", icon: <Icon {...icons.services} /> },
  { href: "/journey", label: "Your journey", icon: <Icon {...icons.journey} /> },
  { href: "/stories", label: "Student stories", icon: <Icon {...icons.stories} /> },
  { href: "/gallery", label: "Gallery", icon: <Icon {...icons.gallery} /> },
  {
    href: "/recruitment",
    label: "Jobs",
    icon: (
      <Stroke>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
      </Stroke>
    ),
  },
  {
    href: "/about",
    label: "About us",
    icon: (
      <Stroke>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M2.5 19.5c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M16 14.2c3 .2 5.5 2.1 5.5 5" />
      </Stroke>
    ),
  },
  {
    href: "/contact",
    label: "Contact us",
    icon: (
      <Stroke>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3.5 7 8.5 6 8.5-6" />
      </Stroke>
    ),
  },
];

export default function NavBar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [hidden,     setHidden]     = useState(false);
  // The page the menu was opened on: a page change closes it by itself.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const prevY = useRef(0);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const pillAt = useRef<Spot | null>(null);
  const pathname = usePathname();
  const mobileOpen = openOn === pathname;
  const setMobileOpen = (open: boolean) => setOpenOn(open ? pathname : null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);

      if (y < 80) {
        setHidden(false);
      } else if (y > prevY.current + 6) {
        setHidden(true);
      } else if (y < prevY.current - 6) {
        setHidden(false);
      }

      prevY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // While the menu is open: no page scroll, Escape closes, focus starts on the
  // close button and goes back to the menu button afterwards.
  useEffect(() => {
    if (!mobileOpen) return;
    const toggle = toggleRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeButton = drawerRef.current?.querySelector<HTMLButtonElement>("button");
    closeButton?.focus();
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpenOn(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      toggle?.focus();
    };
  }, [mobileOpen]);

  // Tab stays inside the open menu.
  const onDrawerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab" || !drawerRef.current) return;
    const focusable = drawerRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const isInnerPage = pathname !== "/";
  const isCurrent = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className={`${styles.nav} ${(scrolled || isInnerPage) ? styles.scrolled : ""} ${hidden && !mobileOpen ? styles.hidden : ""}`}>
      <div className={styles.inner} data-glass="">

        {/* Phones: the menu button sits on the left, as on the old site. */}
        <button
          ref={toggleRef}
          type="button"
          className={styles.toggle}
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          aria-controls="site-menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>

        {/* Logo */}
        <Link href="/" aria-label="Hubble Bubble home" className={styles.logoLink}>
          <Image
            src="/images/logos/logo.webp"
            alt="Hubble Bubble"
            width={119}
            height={64}
            className={styles.logo}
            priority
          />
        </Link>

        {/* Desktop links. A glass pill glides to the link under the mouse. */}
        <div
          ref={linksRef}
          className={styles.links}
          onPointerOver={(event) => {
            if (event.pointerType !== "mouse") return;
            const link = (event.target as Element).closest("a");
            const pill = pillRef.current;
            if (!link || !pill || !linksRef.current?.contains(link)) return;
            const next = { x: link.offsetLeft - PILL_PAD, w: link.offsetWidth + PILL_PAD * 2 };
            pill.style.opacity = "1";
            glide(pill, pillAt.current, next);
            pillAt.current = next;
          }}
          onPointerLeave={() => {
            if (pillRef.current) pillRef.current.style.opacity = "0";
            pillAt.current = null;
          }}
        >
          <span ref={pillRef} className={styles.pill} aria-hidden="true" />
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={pathname.startsWith(href) ? styles.active : ""}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/contact"
            className={`${styles.cta} ${pathname === "/contact" ? styles.ctaActive : ""}`}
            aria-current={pathname === "/contact" ? "page" : undefined}
          >
            Contact Us
          </Link>
        </div>

        {/* Keeps the logo in the middle on phones. */}
        <span className={styles.spacer} aria-hidden="true" />
      </div>

      {/* Phone menu */}
      <div
        className={`${styles.scrim} ${mobileOpen ? styles.scrimOpen : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <div
        id="site-menu"
        ref={drawerRef}
        className={`${styles.drawer} ${mobileOpen ? styles.drawerOpen : ""}`}
        data-glass="frost"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!mobileOpen}
        onKeyDown={onDrawerKeyDown}
      >
        <div className={styles.drawerTop}>
          <Image src="/images/logos/logo.webp" alt="" width={119} height={64} className={styles.drawerLogo} />
          <button
            type="button"
            className={styles.close}
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            tabIndex={mobileOpen ? 0 : -1}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <ul className={styles.menuList}>
          {MENU.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${styles.menuLink} ${isCurrent(item.href) ? styles.menuCurrent : ""} ${item.href === "/contact" ? styles.menuContact : ""}`}
                aria-current={isCurrent(item.href) ? "page" : undefined}
                tabIndex={mobileOpen ? 0 : -1}
                onClick={() => setMobileOpen(false)}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.drawerFoot}>
          <Link href="/privacy" className={styles.footLink} tabIndex={mobileOpen ? 0 : -1} onClick={() => setMobileOpen(false)}>
            Privacy policy
          </Link>
          <span>&copy; {new Date().getFullYear()} Hubble Bubble</span>
        </div>
      </div>
    </nav>
  );
}
