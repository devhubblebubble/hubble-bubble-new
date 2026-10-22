import Image from "next/image";
import Link from "next/link";
import { countryCode, flagSrc } from "@/lib/flags";
import styles from "./Blog.module.scss";

/**
 * A round flag. Always decorative: the country's name is written next to it,
 * so screen readers skip the picture. Nothing is shown for an unknown code.
 */
export function Flag({ code, small = false }: { code?: string; small?: boolean }) {
  const c = countryCode(code);
  if (!c) return null;
  const size = small ? 22 : 36;
  return (
    <span className={`${styles.flag} ${small ? styles.flagSmall : ""}`} aria-hidden="true">
      <Image src={flagSrc(c)} alt="" width={size} height={size} />
    </span>
  );
}

export type HubLink = { path: string; name: string; flag?: string };

/** A Study in or Students from page as a chip with its flag. */
export function HubChip({ hub }: { hub: HubLink }) {
  return (
    <li>
      <Link href={hub.path} className={`${styles.chip} ${styles.flagChip}`}>
        <Flag code={hub.flag} small />
        {hub.name}
      </Link>
    </li>
  );
}
