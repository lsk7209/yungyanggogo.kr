export const siteConfig = {
  name: "영양고고",
  title: "식품영양성분 비교 - 영양고고",
  tagline: "식품영양성분을 기준량과 출처로 비교합니다",
  description:
    "영양고고는 식품영양성분 공공데이터를 100g, 100kcal 등 비교 가능한 기준으로 정리하는 식품영양 데이터 사이트입니다.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://yungyanggogo.kr",
  locale: "ko_KR",
  publisherId: "ca-pub-3050601904412736",
  contactEmail: "contact@yungyanggogo.kr",
  launchedAt: "2026-06-07"
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
