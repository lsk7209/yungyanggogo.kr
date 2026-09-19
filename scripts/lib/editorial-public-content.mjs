// The approved drafts use this small Markdown subset. Keep structure and order;
// never evaluate MDX, HTML, or internal editorial contracts as public content.
export function cleanInline(value) {
  return value.replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)]\((?:https?:\/\/|\/)[^)]+\)/g, "$1")
    .replace(/[`*_]/g, "")
    .replace(/\{[^{}]*\}/g, " ")
    .replace(/\s+/g, " ").trim();
}

function cells(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(publicText);
}

function publicText(value) {
  const links = [];
  const protectedText = value.replace(/\[([^\]]+)]\(((?:https?:\/\/|\/)[^)]+)\)/g, (_, label, href) => {
    const index = links.push(`[${cleanInline(label)}](${href})`) - 1;
    return `@@LINK${index}@@`;
  });
  return cleanInline(protectedText).replace(/@@LINK(\d+)@@/g, (_, index) => links[Number(index)]);
}

export function blocksFromMarkdown(markdown) {
  const lines = markdown.trim().split(/\r?\n/);
  const blocks = [];
  const isList = (line) => /^\s*(?:[-*]|\d+\.)\s+/.test(line);
  const startsBlock = (i) => /^#{3,6}\s|^\s*>|^\s*```/.test(lines[i]) || isList(lines[i]) ||
    (lines[i].trim().startsWith("|") && /^\s*\|\s*:?-{3,}/.test(lines[i + 1] ?? ""));
  for (let i = 0; i < lines.length;) {
    if (!lines[i].trim()) { i++; continue; }
    const heading = lines[i].match(/^(#{3,6})\s+(.+)$/);
    if (/^\s*```/.test(lines[i])) {
      const record = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) record.push(lines[i++]);
      if (i === lines.length) throw new Error("Unclosed editorial code fence");
      i++;
      blocks.push({ type: "code", text: record.join("\n") });
    } else if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: publicText(heading[2]) });
      i++;
    } else if (lines[i].trim().startsWith("|") && /^\s*\|\s*:?-{3,}/.test(lines[i + 1] ?? "")) {
      const headers = cells(lines[i]);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const row = cells(lines[i++]);
        if (row.length !== headers.length) throw new Error("Editorial table column count mismatch");
        rows.push(row);
      }
      blocks.push({ type: "table", headers, rows });
    } else if (isList(lines[i])) {
      const ordered = /^\s*\d+\./.test(lines[i]);
      const items = [];
      while (i < lines.length && isList(lines[i]) && /^\s*\d+\./.test(lines[i]) === ordered) {
        items.push(publicText(lines[i++].replace(/^\s*(?:[-*]|\d+\.)\s+/, "")));
      }
      blocks.push({ type: "list", ordered, items });
    } else {
      const quote = /^\s*>/.test(lines[i]);
      const text = [lines[i++].replace(/^\s*>\s?/, "")];
      while (i < lines.length && lines[i].trim() && !startsBlock(i)) text.push(lines[i++]);
      blocks.push({ type: quote ? "quote" : "paragraph", text: publicText(text.join(" ")) });
    }
  }
  return blocks;
}

export function sectionsFromBody(body) {
  const chunks = body.split(/^##\s+/gm);
  const sections = [];
  if (chunks[0].trim()) sections.push({ id: "introduction", title: "먼저 확인할 내용", blocks: blocksFromMarkdown(chunks[0]) });
  chunks.slice(1).forEach((chunk, index) => {
    const [title, ...lines] = chunk.split(/\r?\n/);
    const slug = title.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "section";
    sections.push({ id: `${index + 1}-${slug}`, title: cleanInline(title), blocks: blocksFromMarkdown(lines.join("\n")) });
  });
  return sections.map((section) => ({ ...section, body: section.blocks.filter((block) => block.type === "paragraph" || block.type === "quote").map((block) => cleanInline(block.text)) }));
}
