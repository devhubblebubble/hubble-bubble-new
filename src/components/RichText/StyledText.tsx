import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import type { ElementType, ReactNode } from "react";

/** CSS classes for the brand highlights, usually from a SCSS module. */
export type MarkClasses = { mint?: string; orange?: string; strong?: string; em?: string };

function markComponents(classes: MarkClasses): PortableTextComponents["marks"] {
  const span = (cls?: string) =>
    function Mark({ children }: { children?: ReactNode }) {
      return cls ? <span className={cls}>{children}</span> : <>{children}</>;
    };
  return {
    mint: span(classes.mint),
    orange: span(classes.orange),
    strong: classes.strong
      ? ({ children }) => <strong className={classes.strong}>{children}</strong>
      : ({ children }) => <strong>{children}</strong>,
    em: classes.em ? ({ children }) => <em className={classes.em}>{children}</em> : ({ children }) => <em>{children}</em>,
    link: ({ children, value }) => {
      const href: string = value?.href ?? "#";
      const external = /^https?:/i.test(href);
      return (
        <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
          {children}
        </a>
      );
    },
  };
}

type StyledProps = {
  value?: PortableTextBlock[];
  /** Element to render, e.g. "h1", "p". Blocks are joined with line breaks. */
  as?: ElementType;
  className?: string;
  marks?: MarkClasses;
  id?: string;
};

/**
 * Renders a short styled field (heading or single paragraph) inside one
 * element: blocks become line breaks, highlights become spans.
 */
export function StyledText({ value, as: Tag = "p", className, marks = {}, id }: StyledProps) {
  if (!value || value.length === 0) return null;
  const components: PortableTextComponents = {
    marks: markComponents(marks),
    block: { normal: ({ children }) => <>{children}</> },
    hardBreak: () => <br />,
  };
  return (
    <Tag className={className} id={id}>
      {value.map((block, i) => (
        <span key={block._key ?? i} style={{ display: "contents" }}>
          {i > 0 && <br />}
          <PortableText value={[block]} components={components} />
        </span>
      ))}
    </Tag>
  );
}

type RichProps = {
  value?: PortableTextBlock[];
  className?: string;
  marks?: MarkClasses;
};

/** Renders paragraphs, headings and lists. */
export function RichText({ value, className, marks = {} }: RichProps) {
  if (!value || value.length === 0) return null;
  const components: PortableTextComponents = { marks: markComponents(marks) };
  return (
    <div className={className}>
      <PortableText value={value} components={components} />
    </div>
  );
}
