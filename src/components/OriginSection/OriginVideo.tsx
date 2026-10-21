"use client";

import { useEffect, useRef } from "react";

// The 10-second loop behind "How it all began", cropped square around the
// bubble. Two sizes (640 and 960 pixels square) in two formats: WebM (VP9) for
// the browsers that play it, MP4 (H.264) for the rest. Nothing is downloaded
// until the section is close to the screen. People who ask their device for
// less motion or less data get the still frame only.
const POSTER = "/video/origin-poster.webp";
const LOAD_MARGIN = "800px 0px";

export default function OriginVideo({ className }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData =
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    const still = reduce.matches || saveData;

    let loaded = false;
    const load = () => {
      if (loaded) return;
      loaded = true;
      video.poster = POSTER;
      if (still) return;
      const needed = video.clientHeight * Math.min(window.devicePixelRatio || 1, 2);
      const size = needed <= 640 ? 640 : 960;
      const webm = video.canPlayType('video/webm; codecs="vp9"') === "probably";
      video.preload = "auto";
      video.src = `/video/origin-${size}.${webm ? "webm" : "mp4"}`;
    };

    const near = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          load();
          near.disconnect();
        }
      },
      { rootMargin: LOAD_MARGIN },
    );
    near.observe(video);
    if (still) return () => near.disconnect();

    // Plays only while it is on screen.
    const onScreen = new IntersectionObserver((entries) => {
      if (entries[entries.length - 1].isIntersecting) {
        load();
        if (!reduce.matches) video.play().catch(() => {});
      } else if (loaded) {
        video.pause();
      }
    });
    onScreen.observe(video);

    const onMotionChange = () => {
      if (reduce.matches) video.pause();
    };
    reduce.addEventListener("change", onMotionChange);
    return () => {
      near.disconnect();
      onScreen.disconnect();
      reduce.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
