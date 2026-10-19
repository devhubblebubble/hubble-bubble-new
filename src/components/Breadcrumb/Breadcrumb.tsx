import Link from "next/link";
import styles from "./Breadcrumb.module.scss";

type Crumb = { href: string; label: string };

type Props = {
  /** Current page label (after Home) */
  current: string;
  /** Optional page between Home and the current one, e.g. Jobs on a role page */
  parent?: Crumb;
  /**
   * Set when the parent already applies horizontal padding (e.g. Stories `.page`,
   * Privacy `.inner`) so we do not double `--pad-x`.
   */
  inset?: boolean;
  /** Slim bar: no large bottom margin */
  flush?: boolean;
};

export default function Breadcrumb({
  current,
  parent,
  inset = false,
  flush = false,
}: Props) {
  const rootClass = [styles.root, inset && styles.rootInset, flush && styles.rootFlush]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      <nav className={styles.nav} aria-label="Breadcrumb">
        <Link href="/" className={styles.breadLink}>
          Home
        </Link>
        <span className={styles.breadSep} aria-hidden="true">
          ›
        </span>
        {parent && (
          <>
            <Link href={parent.href} className={styles.breadLink}>
              {parent.label}
            </Link>
            <span className={styles.breadSep} aria-hidden="true">
              ›
            </span>
          </>
        )}
        <span className={styles.breadCurrent}>{current}</span>
      </nav>
    </div>
  );
}
