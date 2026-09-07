export const siteConfig = {
  name: "영양고고",
  title: "식품 영양성분표 비교 | 칼로리·단백질·나트륨 데이터 - 영양고고",
  tagline: "식품영양성분을 기준량과 출처로 비교합니다",
  description:
    "식품 영양성분표의 칼로리, 단백질, 당류, 나트륨을 100g·100kcal·1회 제공량 기준으로 비교하고 공공데이터 출처와 갱신일을 확인합니다.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://yungyanggogo.kr",
  locale: "ko_KR",
  publisherId: "ca-pub-3050601904412736",
  contactEmail: "contact@yungyanggogo.kr",
  launchedAt: "2026-06-07"
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
