"use client";

import { WorldMapNetwork } from "@/components/WorldMapNetwork";

import styles from "./WorldMapSection.module.scss";

type Props = { headline?: string };

export default function WorldMapSection({ headline }: Props) {
  return (
    <section
      className={styles.section}
      aria-labelledby="world-map-section-heading"
      aria-label="Global presence"
    >
      <div className={styles.mapStage}>
        <WorldMapNetwork
          embedded
          className={styles.network}
          activeRoutes={10}
          mapScale={1.0}
          fitPaddingX={0.02}
          fitPaddingBottom={8}
          routeDuration={17500}
          routeDurationJitter={3200}
          routeDestinationHold={2000}
          routeFadeDuration={420}
        />
      </div>

      <h2 id="world-map-section-heading" className={styles.headline}>
        {headline ?? "Whatever your path, we are here for you!"}
      </h2>
    </section>
  );
}
