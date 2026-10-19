import Link from "next/link";
import type { HomePage } from "@/lib/sanity/types";
import styles from "./OriginSection.module.scss";

type Props = { data: HomePage };

export default function OriginSection({ data }: Props) {
  return (
    <section className={`${styles.section} reveal`} id="more">
      <div className={styles.bg}>
        <video
          src="/Video/brown.mp4"
          autoPlay
          loop
          muted
          playsInline
          className={styles.video}
        />
      </div>
      <div className={styles.content}>
        <h2 className={styles.title}>
          <span className={styles.titleLead}>{data.originTitleLead ?? "How It All"} </span>
          <span className={styles.titleAccent}>{data.originTitleAccent ?? "Began"}</span>
        </h2>
        <p className={styles.lead}>
          {data.originLead}
          <br />
          <span className={styles.leadAccent}>{data.originLeadAccent}</span>
        </p>
        <Link href={data.originButtonHref || "/about"} className={styles.readNow}>
          {data.originButtonLabel ?? "Read now!"}
        </Link>
      </div>
    </section>
  );
}
