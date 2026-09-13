import { NextResponse } from "next/server";
import { fetchNationalNutritionItemsWithDbCache } from "../../../lib/national-nutrition-db";
import { isTursoConfigured } from "../../../lib/db";
import { normalizeNutritionSearchQuery, parseBoundedPositiveInteger } from "../../../lib/nutrition-query";
import {
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
  const q = normalizeNutritionSearchQuery(searchParams.get("q"));
  const pageNo = parseBoundedPositiveInteger(searchParams.get("pageNo"), 1, 10_000);
  const numOfRows = parseBoundedPositiveInteger(searchParams.get("numOfRows"), 12, 50);
  const hasKey = Boolean(getNationalNutritionApiKey());

  if (!hasKey && !isTursoConfigured) {
    return NextResponse.json(
      {
        ok: false,
        source: NATIONAL_NUTRITION_SOURCE,
        datasets: NATIONAL_NUTRITION_DATASETS.map(({ slug, name, shortName }) => ({ slug, name, shortName })),
        message: "현재 전국통합식품영양성분정보 데이터를 제공할 수 없습니다."
      },
      { status: 503 }
    );
  }

  if (dataset && datasetSlugs.has(dataset)) {
    const result = await fetchNationalNutritionItemsWithDbCache({ dataset, query: q, pageNo, numOfRows });
    return NextResponse.json(
      {
        ok: result.ok,
        source: NATIONAL_NUTRITION_SOURCE,
        dataset: result.dataset,
        query: q || null,
        cacheSource: result.cacheSource,
        fallback: result.fallback || false,
        totalCount: result.totalCount,
        count: result.count,
        foods: result.foods,
        message: result.ok ? "" : "현재 영양성분 데이터를 제공할 수 없습니다. 잠시 후 다시 시도해 주세요."
      },
      { status: result.ok ? 200 : toPublicFailureStatus(result.status) },
    );
  }

  const results = await Promise.all(
    NATIONAL_NUTRITION_DATASETS.map((item) =>
      fetchNationalNutritionItemsWithDbCache({
        dataset: item.slug,
        query: q,
        pageNo: 1,
        numOfRows: Math.min(numOfRows, 6)
      })
    )
  );

  const anySuccessful = results.some((result) => result.ok);
  return NextResponse.json({
    ok: anySuccessful,
    source: NATIONAL_NUTRITION_SOURCE,
    query: q || null,
    datasets: results.map((result) => ({
      dataset: result.dataset,
      cacheSource: result.cacheSource,
      fallback: result.fallback || false,
      totalCount: result.totalCount,
      count: result.count,
      foods: result.foods,
      message: result.ok ? "" : "현재 이 데이터셋을 제공할 수 없습니다."
    }))
  }, { status: anySuccessful ? 200 : 502 });
}

function toPublicFailureStatus(status: number) {
  return status >= 400 && status <= 599 ? status : 502;
}
