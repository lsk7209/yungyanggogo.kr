// 공개 글 주소에서 내부 작업명(phase6t)을 없애면서 옛 주소를 영구 이동으로 남긴다.
export const BLOG_SLUG_RENAMES: Record<string, string> = {
  "phase6t-bagel-basis": "bagel-nutrition-per-piece-basis",
  "phase6t-dried-fruit-basis": "dried-fruit-serving-nutrition-basis",
  "phase6t-energy-drink-basis": "energy-drink-caffeine-label-basis",
  "phase6t-konjac-jelly-basis": "konjac-jelly-nutrition-label-basis",
  "phase6t-pickle-basis": "pickle-sodium-serving-basis",
  "phase6t-salad-topping-basis": "salad-topping-nutrition-basis",
};

export const BLOG_SLUG_REDIRECTS = Object.entries(BLOG_SLUG_RENAMES).map(([from, to]) => ({
  source: `/blog/${from}`,
  destination: `/blog/${to}`,
  permanent: true,
}));
