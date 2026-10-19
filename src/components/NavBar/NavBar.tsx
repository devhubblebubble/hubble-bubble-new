"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import styles from "./NavBar.module.scss";

const NAV_LINKS = [
  { href: "/services",    label: "Services" },
  { href: "/recruitment", label: "Jobs"     },
  { href: "/stories",     label: "Stories"  },
  { href: "/about",       label: "About us" },
];

export default function NavBar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [hidden,     setHidden]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const prevY = useRef(0);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);

      if (y < 80) {
        setHidden(false);
      } else if (y > prevY.current + 6) {
        setHidden(true);
        setMobileOpen(false);
      } else if (y < prevY.current - 6) {
        setHidden(false);
      }

      prevY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const isInnerPage = pathname !== "/";

  return (
    <nav className={`${styles.nav} ${(scrolled || isInnerPage) ? styles.scrolled : ""} ${hidden ? styles.hidden : ""}`}>
      <div className={styles.inner}>

        {/* Logo */}
        <Link href="/" aria-label="Hubble Bubble home">
          <Image
            src="/images/logos/logo.svg"
            alt="Hubble Bubble"
            width={119}
            height={64}
            className={styles.logo}
            priority
          />
        </Link>

        {/* Hamburger / close toggle */}
        <button
          className={styles.toggle}
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            /* ✕ icon */
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          ) : (
            /* ☰ icon */
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {/* Links */}
        <div className={`${styles.links} ${mobileOpen ? styles.linksOpen : ""}`}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={pathname.startsWith(href) ? styles.active : ""}
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/contact"
            className={`${styles.cta} ${pathname === "/contact" ? styles.ctaActive : ""}`}
            onClick={() => setMobileOpen(false)}
          >
            Contact Us
          </Link>
        </div>

      </div>
    </nav>
  );
}
