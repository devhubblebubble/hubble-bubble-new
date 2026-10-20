"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

import styles from './JourneySection.module.scss';
const AtlasGlobeEmbed = dynamic(() => import("./AtlasGlobeEmbed"), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', background: 'transparent' }} />
});


import type { JourneyStep } from "@/lib/sanity/types";

type Props = { steps?: JourneyStep[]; outputsLabel?: string };

export default function JourneySection({ steps = [], outputsLabel }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastProgressRef = useRef(0);

  const computeAndApplyProgress = useCallback(() => {
    rafRef.current = null;
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const sectionHeight = sectionRef.current.offsetHeight;
    const scrolled = -rect.top;
    const totalScroll = sectionHeight - window.innerHeight;
    if (totalScroll <= 0) return;

    const rawProgress = Math.max(0, Math.min(1, scrolled / totalScroll));

    // Skip near-identical updates so we don't churn React/three.js on every
    // sub-pixel scroll event. Always honor the 0/1 endpoints.
    const isEndpoint = rawProgress === 0 || rawProgress === 1;
    if (!isEndpoint && Math.abs(rawProgress - lastProgressRef.current) < 0.001) {
      return;
    }
    lastProgressRef.current = rawProgress;
    setProgress(rawProgress);

    const index = Math.min(
      Math.floor(rawProgress * steps.length * 0.999),
      steps.length - 1,
    );
    setActiveIndex((prev) => (prev !== index ? index : prev));
  }, [steps.length]);

  const handleScroll = useCallback(() => {
    // Coalesce rapid scroll events into a single update per animation frame.
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(computeAndApplyProgress);
  }, [computeAndApplyProgress]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    computeAndApplyProgress();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [handleScroll, computeAndApplyProgress]);

  const currentStep = steps[Math.min(activeIndex, steps.length - 1)];
  if (!currentStep) return null;

  return (
    <section
      ref={sectionRef}
      id="journey"
      className={styles.section}
      style={{ height: `${(steps.length + 1) * 100}vh` }}
    >
      <div className={styles.stickyViewport}>

        <div className={styles.layout}>
          <div className={styles.globeWrapper}>
            <AtlasGlobeEmbed rotation={progress} className={styles.globe} />
          </div>

          <div className={styles.contentWrapper}>
            <div className={styles.slideContent}>
              <span className={styles.stepNumber}>
                {currentStep.number}
              </span>

              <h2 className={styles.stepTitle}>
                {currentStep.title}{" "}
                <span className={styles.titleHighlight}>
                  {currentStep.titleHighlight}
                </span>
              </h2>

              <p className={styles.description}>
                {currentStep.description}
              </p>

              <span className={styles.keyOutputsLabel}>
                {outputsLabel ?? "Key Outputs"}
              </span>

              <div className={styles.tagCloud}>
                {(currentStep.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className={styles.tagButton}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.progressWrapper}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressLine}
                  style={{ height: `${progress * 100}%` }}
                />
                <div
                  className={styles.rocketContainer}
                  style={{ bottom: `calc(${progress * 100}% - 24px)` }}
                >
                  <div className={styles.rocketIcon}>
                    <Image
                      src="/images/journey/rocket.png"
                      alt="Rocket"
                      width={36}
                      height={48}
                      priority
                    />
                    <div className={styles.rocketFlame} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.paginationDots}>
          {steps.map((step, i) => (
            <div
              key={step._key ?? i}
              className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
