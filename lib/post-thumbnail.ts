import type { BlogPost } from "./blog";

const themeColors = {
  green: {
    bg: "#e6f0ea",
    ink: "#1e6446",
    accent: "#2e7d5b",
    line: "#b9d7c7"
  },
  amber: {
    bg: "#fbf0e3",
    ink: "#9a5b1e",
    accent: "#d98a3d",
    line: "#f0d2ad"
  },
  slate: {
    bg: "#e9eef3",
    ink: "#31506e",
    accent: "#5b7b9a",
    line: "#c6d5e3"
  },
  terra: {
    bg: "#f4e9e4",
    ink: "#7d4936",
    accent: "#b5765b",
    line: "#dfc6ba"
  },
  gray: {
    bg: "#eef0ed",
    ink: "#596159",
    accent: "#9aa39a",
    line: "#d8ddd6"
  }
};

export function getPostThumbnail(post: BlogPost) {
  const theme = themeColors[post.accentTheme || "green"];
  const keyword = truncateText(post.mainKeyword, 18);
  const category = truncateText(post.category, 12);
  const firstExpandedKeyword = truncateText(post.expandedKeywords[0] || "식품영양성분", 14);
  const bars = buildBars(post.slug);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="420" viewBox="0 0 960 420" role="img" aria-label="${escapeXml(post.title)} 썸네일">
      <rect width="960" height="420" fill="${theme.bg}"/>
      <rect x="48" y="42" width="864" height="336" rx="28" fill="#ffffff" opacity="0.86"/>
      <path d="M74 322 C170 254 245 355 348 291 C459 222 520 274 618 206 C716 137 792 190 878 112" fill="none" stroke="${theme.line}" stroke-width="16" stroke-linecap="round" opacity="0.9"/>
      <circle cx="812" cy="104" r="52" fill="${theme.bg}" stroke="${theme.accent}" stroke-width="8"/>
      <path d="M792 105 l18 18 l32 -44" fill="none" stroke="${theme.accent}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="88" y="80" width="220" height="42" rx="21" fill="${theme.accent}"/>
      <text x="110" y="108" fill="#ffffff" font-size="24" font-family="Arial, sans-serif" font-weight="700">${escapeXml(category)}</text>
      <text x="88" y="182" fill="${theme.ink}" font-size="56" font-family="Arial, sans-serif" font-weight="800">${escapeXml(keyword)}</text>
      <text x="91" y="226" fill="#5b635b" font-size="28" font-family="Arial, sans-serif" font-weight="700">${escapeXml(firstExpandedKeyword)} 기준 확인</text>
      <g transform="translate(90 266)">
        ${bars
          .map(
            (bar, index) => `
              <g transform="translate(${index * 94} 0)">
                <rect x="0" y="${90 - bar}" width="48" height="${bar}" rx="12" fill="${index === 0 ? theme.accent : theme.line}"/>
                <text x="24" y="122" text-anchor="middle" fill="${theme.ink}" font-size="18" font-family="Arial, sans-serif" font-weight="700">${["kcal", "단백", "당류", "Na"][index]}</text>
              </g>
            `
          )
          .join("")}
      </g>
      <g transform="translate(620 242)">
        <rect width="228" height="84" rx="20" fill="${theme.bg}" stroke="${theme.line}" stroke-width="3"/>
        <text x="24" y="34" fill="${theme.ink}" font-size="24" font-family="Arial, sans-serif" font-weight="800">출처·기준량</text>
        <text x="24" y="64" fill="#5b635b" font-size="20" font-family="Arial, sans-serif" font-weight="700">공공데이터 확인</text>
      </g>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function buildBars(seed: string) {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) % 9973;
  }

  return [46, 58, 39, 66].map((value, index) => 28 + ((value + hash + index * 17) % 58));
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
