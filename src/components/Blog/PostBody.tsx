import Link from "next/link";
import type { ReactNode } from "react";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { parseInline, stripInline, type HeadingLink } from "@/lib/blog/text";
import type { PostBody as Body, PostTable } from "@/lib/sanity/types";
import styles from "./Blog.module.scss";

/** A link: pages on this site open in place, other sites in a new tab. */
export function SmartLink({ href, children }: { href?: string; children: ReactNode }) {
  const target = href ?? "#";
  if (target.startsWith("/") && !target.startsWith("//")) {
    return <Link href={target}>{children}</Link>;
  }
  const external = /^https?:/i.test(target);
  return (
    <a href={target} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
      {children}
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}

/** Table cell text with **bold** and [links](url). */
function CellText({ value }: { value: string }) {
  return (
    <>
      {parseInline(value).map((part, i) => {
        const content = part.bold ? <strong>{part.text}</strong> : part.text;
        return part.href ? (
          <SmartLink key={i} href={part.href}>
            {content}
          </SmartLink>
        ) : (
          <span key={i}>{content}</span>
        );
      })}
    </>
  );
}

function Table({ value }: { value: PostTable }) {
  const rows = (value.rows ?? []).map((r) => r.cells ?? []).filter((cells) => cells.length > 0);
  if (rows.length === 0) return null;
  const [head, ...rest] = rows;
  const label = head.map(stripInline).filter(Boolean).join(", ");
  return (
    // Wide tables scroll sideways inside this box on phones; the page never does.
    <div className={styles.tableWrap} role="region" aria-label={`Table: ${label}`} tabIndex={0}>
      <table className={styles.table}>
        <thead>
          <tr>
            {head.map((cell, i) => (
              <th key={i} scope="col">
                <CellText value={cell} />
              </th>
            ))}
          </tr>
        </thead>
        {rest.length > 0 && (
          <tbody>
            {rest.map((cells, r) => (
              <tr key={r}>
                {cells.map((cell, c) =>
                  c === 0 ? (
                    <th key={c} scope="row">
                      <CellText value={cell} />
                    </th>
                  ) : (
                    <td key={c}>
                      <CellText value={cell} />
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
}

/** The post text: paragraphs, headings (h2s carry their anchor id), lists and tables. */
export default function PostBody({ body, headings }: { body?: Body; headings: HeadingLink[] }) {
  if (!body || body.length === 0) return null;
  const idFor = new Map(headings.map((h) => [h.key, h.id]));
  const components: PortableTextComponents = {
    block: {
      normal: ({ children }) => <p>{children}</p>,
      h2: ({ children, value }) => <h2 id={idFor.get(value._key ?? "")}>{children}</h2>,
      h3: ({ children }) => <h3>{children}</h3>,
    },
    list: {
      bullet: ({ children }) => <ul>{children}</ul>,
      number: ({ children }) => <ol>{children}</ol>,
    },
    marks: {
      link: ({ children, value }) => <SmartLink href={value?.href}>{children}</SmartLink>,
    },
    types: {
      table: ({ value }) => <Table value={value as PostTable} />,
    },
  };
  return (
    <div className={styles.prose}>
      <PortableText value={body as PortableTextBlock[]} components={components} />
    </div>
  );
}
