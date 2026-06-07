import { NextResponse } from "next/server";
import {
  fetchNationalNutritionDatasets,
  fetchNationalNutritionItems,
  getNationalNutritionApiKey,
  NATIONAL_NUTRITION_DATASETS,
  NATIONAL_NUTRITION_SOURCE,
  type NationalNutritionDatasetSlug
} from "../../../lib/national-nutrition-api";

export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

const datasetSlugs = new Set(NATIONAL_NUTRITION_DATASETS.map((dataset) => dataset.slug));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dataset = searchParams.get("dataset") as NationalNutritionDatasetSlug | null;
  const q = searchParams.get("q")?.trim();
  const pageNo = Number(searchParams.get("pageNo") || "1");
  const numOfRows = Number(searchParams.get("numOfRows") || "12");
  const hasKey = Boolean(getNationalNutritionApiKey());

  if (!hasKey) {
    return NextResponse.json(
      {
        ok: false,
        source: NATIONAL_NUTRITION_SOURCE,
        datasets: NATIONAL_NUTRITION_DATASETS,
        message:
          "DATA_GO_KR_NUTRITION_KEY 또는 DATA_GO_KR_SERVICE_KEY가 서버 환경변수에 없어 전국통합식품영양성분정보 데이터를 표시할 수 없습니다."
      },
      { status: 503 }
    );
  }

  if (dataset && datasetSlugs.has(dataset)) {
    const result = await fetchNationalNutritionItems({ dataset, query: q, pageNo, numOfRows });
    return NextResponse.json({
      ok: result.ok,
      source: NATIONAL_NUTRITION_SOURCE,
      dataset: result.dataset,
      query: q || null,
      fallback: result.fallback || false,
      totalCount: result.totalCount,
      count: result.count,
      foods: result.foods,
      message: result.message
    });
  }

  const results = await fetchNationalNutritionDatasets({ query: q, numOfRows: Math.min(numOfRows, 6) });

  return NextResponse.json({
    ok: results.some((result) => result.ok),
    source: NATIONAL_NUTRITION_SOURCE,
    query: q || null,
    datasets: results.map((result) => ({
      dataset: result.dataset,
      fallback: result.fallback || false,
      totalCount: result.totalCount,
      count: result.count,
      foods: result.foods,
      message: result.message
    }))
  });
}
