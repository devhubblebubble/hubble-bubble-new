import Image from "next/image";
import Link from "next/link";
import Beam from "@/components/Beam/Beam";
import { getSiteSettings } from "@/lib/sanity/data";
import styles from "./FooterSection.module.scss";

export default async function FooterSection() {
  const settings = await getSiteSettings();
  const addressLines = (settings.address ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const showBadges = Boolean(settings.googlePlayUrl || settings.appStoreUrl);

  return (
    <footer className={styles.footer}>
      <Beam className={styles.beamSpacing} />
      <div className={styles.grid}>

        {/* Brand + address */}
        <div className={styles.brand}>
          <Image
            src="/images/logos/footer-hubblebubble.png"
            alt={settings.siteName}
            width={158}
            height={94}
            style={{ objectFit: "contain", objectPosition: "left" }}
          />
          {addressLines.length > 0 && (
            <address>
              {addressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </address>
          )}
        </div>

        {/* Nav links */}
        <nav className={styles.links} aria-label="Footer navigation">
          <Link href="/services">Services</Link>
          <Link href="/recruitment">Jobs</Link>
          <Link href="/stories">Stories</Link>
          <Link href="/about">About Us</Link>
          <Link href="/contact">Contact Us</Link>
          <Link href="/contact?type=collab">Collaborate</Link>
          <Link href="/privacy">Privacy Policy</Link>
        </nav>

        {/* Contact */}
        <div className={styles.contact}>
          {settings.phone && (
            <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}>{settings.phone}</a>
          )}
          <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
        </div>

        {/* HubbleX + app badges */}
        <div className={styles.app}>
          <Image
            src="/images/logos/footer-hubblex.png"
            alt="HubbleX"
            width={130}
            height={40}
            style={{ objectFit: "contain", objectPosition: "right" }}
          />
          {showBadges && (
            <div className={styles.badges}>
              {settings.googlePlayUrl && (
                <a
                  href={settings.googlePlayUrl}
                  className={styles.badge}
                  aria-label="Get it on Google Play"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.18 23.76c.38.22.82.27 1.24.14l11.9-6.87-2.62-2.62-10.52 9.35zM.5 2.1A1.74 1.74 0 0 0 0 3.37v17.26c0 .48.18.92.5 1.27l.07.06 9.67-9.67v-.23L.57 2.04.5 2.1zM20.3 10.5l-2.6-1.5-2.91 2.92 2.91 2.9 2.62-1.51a1.74 1.74 0 0 0 0-2.81zM4.42.1L16.33 7l-2.62 2.62L3.18.27A1.62 1.62 0 0 1 4.42.1z"/>
                  </svg>
                  <div className={styles.badgeText}>
                    <span className={styles.badgeSmall}>GET IT ON</span>
                    <span className={styles.badgeLarge}>Google Play</span>
                  </div>
                </a>
              )}

              {settings.appStoreUrl && (
                <a
                  href={settings.appStoreUrl}
                  className={styles.badge}
                  aria-label="Download on the App Store"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className={styles.badgeText}>
                    <span className={styles.badgeSmall}>Download on the</span>
                    <span className={styles.badgeLarge}>App Store</span>
                  </div>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
