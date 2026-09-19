import { createElement, type ReactNode } from "react";
import Link from "next/link";
import type { BlogBlock } from "../lib/blog";

function inlineText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(/\[([^\]]+)]\(((?:https?:\/\/|\/)[^)]+)\)/g)) {
    nodes.push(text.slice(cursor, match.index));
    const [, label, href] = match;
    // Reject protocol-relative links; never interpret HTML or MDX expressions.
    nodes.push(href.startsWith("//") ? label : href.startsWith("/")
      ? <Link key={match.index} href={href}>{label}</Link>
      : <a key={match.index} href={href} target="_blank" rel="noreferrer">{label}</a>);
    cursor = match.index + match[0].length;
  }
  nodes.push(text.slice(cursor));
  return nodes;
}

export function ArticleBlocks({ blocks }: { blocks: BlogBlock[] }) {
  return blocks.map((block, index) => {
    if (block.type === "table") return (
      <div className="article-table-scroll" role="region" aria-label="본문 비교표" tabIndex={0} key={index}>
        <table>
          <thead><tr>{block.headers.map((header, column) => <th scope="col" key={column}>{inlineText(header)}</th>)}</tr></thead>
          <tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, column) => column === 0 ? <th scope="row" key={column}>{inlineText(cell)}</th> : <td key={column}>{inlineText(cell)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    );
    if (block.type === "heading") return createElement(`h${Math.min(6, Math.max(3, block.level))}`, { key: index }, inlineText(block.text));
    if (block.type === "list") {
      const List = block.ordered ? "ol" : "ul";
      return <List key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{inlineText(item)}</li>)}</List>;
    }
    if (block.type === "quote") return <blockquote key={index}><p>{inlineText(block.text)}</p></blockquote>;
    if (block.type === "code") return <pre className="article-record" key={index}>{block.text}</pre>;
    return <p key={index}>{inlineText(block.text)}</p>;
  });
}
