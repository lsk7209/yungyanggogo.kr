import type { BlogSection } from "../lib/blog";

type TableOfContentsProps = {
  sections: BlogSection[];
};

export function TableOfContents({ sections }: TableOfContentsProps) {
  if (sections.length < 2) {
    return null;
  }

  return (
    <nav className="toc" aria-label="글 목차">
      <p className="toc__label">목차</p>
      <ol>
        {sections.map((section) => (
          <li key={section.id}>
            <a href={`#${section.id}`}>{section.title}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
