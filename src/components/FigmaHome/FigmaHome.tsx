"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import EligibilityModal from "@/components/EligibilityModal";
import WorldMapSection from "@/components/WorldMapSection/WorldMapSection";
import styles from "./FigmaHome.module.scss";

// ─── Data ────────────────────────────────────────────────────────────────────

const students = [
  {
    name: "Jagadesh Kaliappan",
    course: "MSc. Artificial Intelligence in Games",
    flag: "🇬🇧",
    linkedin: false,
    admits: [
      { type: "img" as const, src: "/images/impact/cambridge.png", alt: "Cambridge" },
      { type: "text" as const, label: "NORTHUMBRIA" },
      { type: "img" as const, src: "/images/impact/cambridge.png", alt: "Cambridge" },
      { type: "img" as const, src: "/images/impact/dundee.png", alt: "Durham" },
    ],
  },
  {
    name: "Rupsee Padhi",
    course: "MSc. Social Innovation & Entrepreneurship",
    flag: "🇬🇧",
    linkedin: true,
    admits: [
      { type: "img" as const, src: "/images/impact/cambridge.png", alt: "Cambridge" },
      { type: "text" as const, label: "ST ANDREWS" },
      { type: "img" as const, src: "/images/impact/dundee.png", alt: "Durham" },
      { type: "text" as const, label: "SUSSEX" },
    ],
  },
  {
    name: "Amir Shah",
    course: "BA (Hons) Game Design",
    flag: "🇬🇧",
    linkedin: true,
    admits: [
      { type: "img" as const, src: "/images/impact/dundee.png", alt: "Durham" },
      { type: "img" as const, src: "/images/impact/cambridge.png", alt: "Cambridge" },
      { type: "text" as const, label: "UAL" },
      { type: "text" as const, label: "GOLDSMITHS" },
    ],
  },
];

const mapPins = [
  { label: "India", x: 65, y: 48 },
  { label: "UAE", x: 55, y: 42 },
  { label: "South Africa", x: 53, y: 75 },
  { label: "UK", x: 46, y: 25 },
  { label: "Germany", x: 48, y: 32 },
  { label: "USA", x: 23, y: 38 },
  { label: "Argentina", x: 32, y: 80 },
  { label: "Canada", x: 22, y: 24 },
  { label: "Australia", x: 85, y: 78 },
  { label: "China", x: 78, y: 38 },
  { label: "Russia", x: 60, y: 18 },
];

const storyCards = [
  {
    image: "/images/testimonial/student1.webp",
    headline: "Leaving Law Behind to Tell Stories That Matter and Impact.",
    body: "Nihal thought law school was his only option. But his essays revealed something else — a writer's voice. Now he's studying literature and published in two journals.",
    link: "Read Nihal's story and journey →",
  },
  {
    image: "/images/testimonial/student2.webp",
    headline: "Building a Mission-Driven Career from the Ground Up.",
    body: "Serah came in considering an MBA. After career mapping sessions, she launched a social innovation project — and is now studying social entrepreneurship with a scholarship at University of St. Andrews.",
    link: "Read Serah's story and journey →",
  },
];

const testimonials = [
  {
    img1: "/images/testimonial/student3.webp",
    img2: "/images/testimonial/student4.webp",
    quote:
      "I walked in with plans to study engineering. Through conversations and career mapping, I realised game design was where I truly belonged. I can't thank the team enough for helping me see my potential clearly and guiding me every step of the way — from building my portfolio to writing my personal statement.",
    name: "Rhea Menon",
    course: "BA (Hons) Game Design",
    uni: "University of the Arts London",
    large: false,
  },
  {
    img1: "/images/testimonial/student4.webp",
    img2: "/images/testimonial/student3.webp",
    quote: "Hubble Bubble didn't just help with applications — they helped me discover why I was applying.",
    name: "Priya Sinha",
    course: "MSc Social Innovation and Entrepreneurship",
    uni: "University of Sussex",
    large: true,
  },
];

const collabs = ["amber", "Revolut", "graduate talent pool", "Erasmus+", "HSBC", "British Council", "Wise", "UNiDAYS"];

// ─── Carousel hook ────────────────────────────────────────────────────────────

function useCarousel(count: number, autoMs = 7000) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (i: number) => setIdx(((i % count) + count) % count),
    [count]
  );

  useEffect(() => {
    if (paused || count < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), autoMs);
    return () => clearInterval(t);
  }, [paused, count, autoMs]);

  return { idx, go, setPaused };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FigmaHome() {
  const [eligibilityOpen, setEligibilityOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const studentC = useCarousel(students.length, 6500);
  const storiesC = useCarousel(storyCards.length, 7000);
  const testimonialC = useCarousel(testimonials.length, 7000);

  const globeRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // Sticky nav blur
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Globe slow rotation
  useEffect(() => {
    let angle = 0;
    const tick = () => {
      angle += 0.04;
      if (globeRef.current) globeRef.current.style.transform = `rotate(${angle}deg)`;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Reveal on scroll
  useEffect(() => {
    const revealClass = styles.reveal;
    const activeClass = styles.in;
    const els = document.querySelectorAll(`.${revealClass}`);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(activeClass);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <main className={styles.page}>

        {/* ── NAV ── */}
        <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
          <div className={styles.navInner}>
            <Link href="/" className={styles.navBrand} aria-label="Hubble Bubble home">
              <Image
                src="/images/logos/logo.svg"
                alt="Hubble Bubble"
                width={119}
                height={64}
                className={styles.navLogo}
                priority
              />
            </Link>
            <button
              className={styles.navToggle}
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              </svg>
            </button>
            <div
              className={`${styles.navLinks} ${mobileOpen ? styles.navLinksOpen : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <Link href="/services">Services</Link>
              <Link href="/about">About us</Link>
              <Link href="/stories">More</Link>
              <Link href="/contact" className={styles.navCta}>Contact Us</Link>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className={styles.hero} id="top">
          <div className={styles.heroGrid}>
            <div className={`${styles.heroLeft} ${styles.reveal}`}>
              <h1 className={styles.heroHeadline}>
                We are the<br />Anti-Agent Agents!<br />We Actually Care<br />Where You End Up.
              </h1>
              <div className={styles.heroRule} />
              <p className={styles.heroSub}>
                So stop guessing. Let's find the degree<br />that fits your personality and passion!
              </p>
              <div className={styles.heroCtas}>
                <button
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={() => setEligibilityOpen(true)}
                >
                  Take the eligibility Test
                </button>
                <Link href="/contact" className={`${styles.btn} ${styles.btnGhost}`}>
                  Book a call
                </Link>
              </div>
              <div className={styles.accred}>
                <div className={styles.accredLabel}>Accredited by:</div>
                <div className={styles.accredRow}>
                  <span className={styles.accredWordmark}>UCAS</span>
                  <span className={styles.accredWordmark}>BAC</span>
                  <Image
                    src="/images/herosection/accreditations/icef.png"
                    alt="ICEF"
                    width={99}
                    height={34}
                    className={styles.icefLogo}
                  />
                </div>
              </div>
            </div>

            <div className={`${styles.heroRight} ${styles.reveal}`}>
              <div
                className={styles.studentCarousel}
                onMouseEnter={() => studentC.setPaused(true)}
                onMouseLeave={() => studentC.setPaused(false)}
              >
                <div
                  className={styles.studentTrack}
                  style={{ transform: `translateX(-${studentC.idx * 100}%)` }}
                >
                  {students.map((s) => (
                    <article className={styles.studentCard} key={s.name}>
                      <div className={styles.studentPhotoWrap}>
                        <div
                          className={styles.studentPhoto}
                          style={{ backgroundImage: "url('/images/impact/dp.png')" }}
                        />
                        <div className={styles.studentFlag}>{s.flag}</div>
                      </div>
                      <div className={styles.studentName}>
                        {s.name}
                        {s.linkedin && <span className={styles.linkedinPill}>in</span>}
                      </div>
                      <div className={styles.studentCourse}>{s.course}</div>
                      <div className={styles.studentAdmitsLabel}>Admits:</div>
                      <div className={styles.studentAdmits}>
                        {s.admits.map((a, i) =>
                          a.type === "img" ? (
                            <Image
                              key={i}
                              src={a.src!}
                              alt={a.alt!}
                              width={160}
                              height={56}
                              className={styles.admitImg}
                            />
                          ) : (
                            <span key={i} className={styles.admitWordmark}>
                              {a.label}
                            </span>
                          )
                        )}
                      </div>
                    </article>
                  ))}
                </div>
                <Dots
                  count={students.length}
                  idx={studentC.idx}
                  onPrev={() => studentC.go(studentC.idx - 1)}
                  onNext={() => studentC.go(studentC.idx + 1)}
                  onDot={studentC.go}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── WORLD MAP ── */}
        <WorldMapSection />

        {/* ── PROOF CARDS ── */}
        <section className={styles.cards} id="about">
          <article className={`${styles.card} ${styles.cardEdge} ${styles.reveal}`}>
            <div className={styles.cardGrid}>
              <p className={styles.cardText}>
                Being named Winner of the 2023 Scottish EDGE is more than an award for Hubble Bubble—it's a promise
                to students. It shows that our mission of honest guidance, passion-driven mentoring, and building
                credible opportunities is not only possible but recognised as innovative and transformative for study
                abroad journeys.
              </p>
              <div>
                <h3 className={styles.cardHeading}>
                  Funded by<br />Scottish Edge
                </h3>
                <Image
                  src="/images/logos/footer-hubblebubble.png"
                  alt="Scottish Edge"
                  width={460}
                  height={120}
                  className={styles.partnerLogo}
                />
              </div>
            </div>
          </article>

          <article className={`${styles.card} ${styles.cardBos} ${styles.reveal}`}>
            <div className={`${styles.cardGrid} ${styles.cardGridFlip}`}>
              <div>
                <h3 className={styles.cardHeading}>
                  Backed by the<br />Bank of Scotland
                </h3>
                <Image
                  src="/images/logos/footer-hubblex.png"
                  alt="Bank of Scotland"
                  width={460}
                  height={120}
                  className={styles.partnerLogo}
                />
              </div>
              <p className={`${styles.cardText} ${styles.cardTextRight}`}>
                Supported by the Bank of Scotland, Hubble Bubble is rewriting what a study abroad consultancy should
                be. We're not here to sell quick fixes; we're here to challenge the norm, back student dreams with
                substance, and prove that startups with integrity can reshape futures on a global scale.
              </p>
            </div>
          </article>

          <article className={`${styles.card} ${styles.cardCollab} ${styles.reveal}`}>
            <div className={styles.cardCollabInner}>
              <h3 className={styles.cardHeading}>
                and key collaborations<br />with a lot more!
              </h3>
              <p className={styles.cardText}>
                From top UK universities to global scholarship bodies, trusted banks, housing providers, and student
                support organisations — our wide network of collaborations ensures students thrive at every stage
                abroad.
              </p>
              <div className={styles.collabStrip}>
                {collabs.map((name) => (
                  <div key={name} className={styles.collabLogo}>
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </section>

        {/* ── STORIES ── */}
        <section className={styles.stories} id="stories">
          <div
            className={styles.storiesTrackWrap}
            onMouseEnter={() => storiesC.setPaused(true)}
            onMouseLeave={() => storiesC.setPaused(false)}
          >
            <div
              className={styles.storiesTrack}
              style={{ transform: `translateX(-${storiesC.idx * 100}%)` }}
            >
              {storyCards.map((s) => (
                <article className={`${styles.story} ${styles.reveal}`} key={s.headline}>
                  <div
                    className={styles.storyImage}
                    style={{ backgroundImage: `url('${s.image}')` }}
                  />
                  <div>
                    <h3 className={styles.storyHeadline}>{s.headline}</h3>
                    <div className={styles.storyRule} />
                    <p className={styles.storyBody}>{s.body}</p>
                    <Link href="/stories" className={styles.storyLink}>
                      {s.link}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className={styles.storiesFooter}>
            <Dots
              count={storyCards.length}
              idx={storiesC.idx}
              onPrev={() => storiesC.go(storiesC.idx - 1)}
              onNext={() => storiesC.go(storiesC.idx + 1)}
              onDot={storiesC.go}
              noMargin
            />
            <Link href="/stories" className={styles.viewAll}>
              View all stories
            </Link>
          </div>
        </section>

        {/* ── JOURNEY ── */}
        <section className={styles.journey} id="services">
          <div className={styles.journeyGlobe} ref={globeRef} />
          <div className={styles.journeyOrbit} />
          <div className={`${styles.journeyContent} ${styles.reveal}`}>
            <div className={styles.journeyNum}>01</div>
            <h3 className={styles.journeyTitle}>
              Your journey<br />starts with<br />the lost you.
            </h3>
            <p className={styles.journeyBody}>
              While other consultants shove random degrees down your Oesophagus, we actually care about who you are.
              Our Magic-Spell "Revelio" blends your passion, dreams, and skillset into one powerful profile so we can
              finally understand the complete, complex, amazing human that is you.
            </p>
            <div className={styles.journeyOutputsLabel}>Key Outputs</div>
            <div className={styles.journeyPills}>
              {["Personality Trait", "Skillset Audit", "Career Blueprint"].map((p) => (
                <button key={p} className={styles.journeyPill}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.journeyScrollbar} />
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className={styles.testimonials}>
          <div className={styles.reveal}>
            <h2>They Made It. So Can You!</h2>
            <p className={styles.lead}>
              Hear from our students who turned uncertainty into confidence and found their place in the world.
            </p>
          </div>
          <div
            className={styles.testimonialsTrackWrap}
            onMouseEnter={() => testimonialC.setPaused(true)}
            onMouseLeave={() => testimonialC.setPaused(false)}
          >
            <div
              className={styles.testimonialsTrack}
              style={{ transform: `translateX(-${testimonialC.idx * 100}%)` }}
            >
              {testimonials.map((t) => (
                <article className={styles.testimonial} key={t.name}>
                  <div className={styles.testimonialPhotos}>
                    <div className={styles.testimonialPhotoBack}>
                      <Image src={t.img1} alt="" fill style={{ objectFit: "cover" }} sizes="400px" />
                    </div>
                    <div className={styles.testimonialPhotoFront}>
                      <Image src={t.img2} alt="" fill style={{ objectFit: "cover" }} sizes="400px" />
                    </div>
                  </div>
                  <div className={styles.testimonialQuote}>
                    <p className={`${styles.testimonialQuoteText} ${t.large ? styles.testimonialQuoteLarge : ""}`}>
                      {t.quote}
                    </p>
                    <div className={styles.testimonialName}>{t.name}</div>
                    <div className={styles.testimonialCourse}>{t.course}</div>
                    <div className={styles.testimonialUni}>{t.uni}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className={styles.testimonialsFooter}>
            <Dots
              count={testimonials.length}
              idx={testimonialC.idx}
              onPrev={() => testimonialC.go(testimonialC.idx - 1)}
              onNext={() => testimonialC.go(testimonialC.idx + 1)}
              onDot={testimonialC.go}
              noMargin
            />
          </div>
        </section>

        {/* ── ORIGIN ── */}
        <section className={`${styles.origin} ${styles.reveal}`} id="more">
          <div className={styles.originBg}>
            <video
              src="/Video/brown.mp4"
              autoPlay
              loop
              muted
              playsInline
              className={styles.originVideo}
            />
          </div>
          <div className={styles.originContent}>
            <h2>How It All Began</h2>
            <p className={styles.lead}>
              From one spark came a constellation - our very own<br />Big Bang Theory
            </p>
            <Link href="/about" className={styles.readNow}>
              Read now!
            </Link>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className={styles.finalCta} id="contact">
          <div className={styles.finalCtaGrid}>
            <div className={`${styles.finalCtaFigure} ${styles.reveal}`} />
            <div className={`${styles.finalCtaText} ${styles.reveal}`}>
              <h2>
                Still not sure<br />where to start?<br />That's why we're here!
              </h2>
              <p>Our experts have guided hundreds of students from uncertainty to success. Now it's your turn.</p>
              <div className={styles.finalCtaButtons}>
                <button
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={() => setEligibilityOpen(true)}
                >
                  Take the eligibility Test
                </button>
                <Link href="/contact" className={`${styles.btn} ${styles.btnGhost}`}>
                  Book a call
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className={styles.footer}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <Image src="/images/logos/logo.svg" alt="Hubble Bubble" width={158} height={94} />
              <p>9 Sighthill Ct,<br />Edinburgh<br />EH11 4BN, United Kingdom</p>
            </div>
            <nav className={styles.footerLinks} aria-label="Footer navigation">
              <Link href="/services">Services</Link>
              <Link href="/contact">Contact Us</Link>
              <Link href="/stories">Blogs</Link>
              <Link href="/about">About Us</Link>
              <Link href="/contact">Careers</Link>
              <Link href="/contact?type=collab">Collaborate</Link>
            </nav>
            <div className={styles.footerContact}>
              <p><a href="tel:+444342343242">+44 43423 43242</a></p>
              <p><a href="mailto:contact@hubblebubble.uk">contact@hubblebubble.uk</a></p>
            </div>
            <div className={styles.footerApp}>
              <div className={styles.twitterLockup}>
                <Image src="/images/logos/logo.svg" alt="" width={36} height={22} />
                <span>X</span>
              </div>
              <div className={styles.footerSocials}>
                <a href="#" aria-label="Instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                  </svg>
                </a>
                <a href="#" aria-label="LinkedIn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
                  </svg>
                </a>
                <a href="#" aria-label="Facebook">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12z" />
                  </svg>
                </a>
                <a href="#" aria-label="YouTube">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.5 6.5a3 3 0 0 0-2.1-2.13C19.5 4 12 4 12 4s-7.5 0-9.4.37A3 3 0 0 0 .5 6.5C.13 8.4.13 12 .13 12s0 3.6.37 5.5a3 3 0 0 0 2.1 2.13C4.5 20 12 20 12 20s7.5 0 9.4-.37a3 3 0 0 0 2.1-2.13c.37-1.9.37-5.5.37-5.5s0-3.6-.37-5.5zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
                  </svg>
                </a>
              </div>
              <div className={styles.appStoreBadge}>
                <span>HubbleX</span>
                <small>Coming soon on mobile</small>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {eligibilityOpen && (
        // This old home page is not used by the site any more. The address is only here so it still compiles.
        <EligibilityModal
          isOpen={eligibilityOpen}
          onClose={() => setEligibilityOpen(false)}
          contactEmail="hello@hubblebubble.club"
        />
      )}
    </>
  );
}

// ─── Carousel dots + controls ─────────────────────────────────────────────────

function Dots({
  count,
  idx,
  onPrev,
  onNext,
  onDot,
  noMargin = false,
}: {
  count: number;
  idx: number;
  onPrev: () => void;
  onNext: () => void;
  onDot: (i: number) => void;
  noMargin?: boolean;
}) {
  return (
    <div className={styles.carouselControls} style={noMargin ? { marginTop: 0 } : undefined}>
      <button className={styles.carouselBtn} onClick={onPrev} aria-label="Previous">
        <svg width="9" height="18" viewBox="0 0 9 18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7.5 1.5 1.5 9l6 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className={styles.carouselDots}>
        {Array.from({ length: count }).map((_, i) => (
          <span
            key={i}
            className={`${styles.dot} ${i === idx ? styles.dotActive : ""}`}
            onClick={() => onDot(i)}
          />
        ))}
      </div>
      <button className={styles.carouselBtn} onClick={onNext} aria-label="Next">
        <svg width="9" height="18" viewBox="0 0 9 18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m1.5 1.5 6 7.5-6 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
