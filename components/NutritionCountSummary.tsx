import { describeNutritionCount, type NutritionCountInfo } from "../lib/nutrition-count";

export function NutritionCountSummary({ result, filtered = false }: {
  result: (NutritionCountInfo & { ok: boolean }) | null;
  filtered?: boolean;
}) {
  return (
    <span className="nutrition-count-summary">
      <span>{describeNutritionCount(result, filtered)}</span>
      {result?.ok && result.countCheckedAt && <>
        <br />
        <small>건수 확인: <time dateTime={result.countCheckedAt}>{formatTime(result.countCheckedAt)}</time> (한국시간)</small>
      </>}
      {result?.ok && result.latestStoredAt && <>
        <br />
        <small>자료 최근 저장: <time dateTime={result.latestStoredAt}>{formatTime(result.latestStoredAt)}</time> (한국시간)</small>
      </>}
      {result?.ok && <>
        <br />
        <small>{result.countScope === "stored"
          ? "저장된 자료의 범위이며 원천 전체 수집을 뜻하지 않습니다."
          : "원천 응답에는 캐시된 자료가 포함될 수 있습니다."} 확인·저장 시각은 원자료 갱신일이 아닙니다.</small>
      </>}
    </span>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short",
  }).format(new Date(value));
}
