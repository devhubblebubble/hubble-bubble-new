import Link from "next/link";
import styles from "./Breadcrumb.module.scss";

type Crumb = { href: string; label: string };

type Props = {
  /** Current page label (after Home) */
  current: string;
  /** Optional page between Home and the current one, e.g. Jobs on a role page */
  parent?: Crumb;
  /** Several pages between Home and the current one, e.g. Blog, then a topic */
  parents?: Crumb[];
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
  parents,
  inset = false,
  flush = false,
}: Props) {
  const rootClass = [styles.root, inset && styles.rootInset, flush && styles.rootFlush]
    .filter(Boolean)
    .join(" ");
  const between = parents ?? (parent ? [parent] : []);

  return (
    <div className={rootClass}>
      <nav className={styles.nav} aria-label="Breadcrumb">
        <Link href="/" className={styles.breadLink}>
          Home
        </Link>
        <span className={styles.breadSep} aria-hidden="true">
          ›
        </span>
        {between.map((crumb) => (
          <span key={crumb.href} className={styles.breadStep}>
            <Link href={crumb.href} className={styles.breadLink}>
              {crumb.label}
            </Link>
            <span className={styles.breadSep} aria-hidden="true">
              ›
            </span>
          </span>
        ))}
        <span className={styles.breadCurrent}>{current}</span>
      </nav>
    </div>
  );
}
