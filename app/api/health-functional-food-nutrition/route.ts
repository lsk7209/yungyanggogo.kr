import { NextResponse } from "next/server";
import {
  fetchHealthFunctionalFoodNutritionItems,
  getHealthFunctionalFoodNutritionApiKey,
  HEALTH_FUNCTIONAL_FOOD_NUTRITION_API_ENDPOINT,
  HEALTH_FUNCTIONAL_FOOD_NUTRITION_SOURCE
} from "../../../lib/health-functional-food-nutrition-api";

export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

export async function GET(request: Request) {
  if (!getHealthFunctionalFoodNutritionApiKey()) {
    return NextResponse.json(
      {
        ok: false,
        source: HEALTH_FUNCTIONAL_FOOD_NUTRITION_SOURCE,
        message: "현재 건강기능식품 영양성분 데이터를 제공할 수 없습니다."
      },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const pageNo = Number(searchParams.get("pageNo") || "1");
  const numOfRows = Number(searchParams.get("numOfRows") || "12");
  const result = await fetchHealthFunctionalFoodNutritionItems({
    query: q,
    pageNo: Number.isFinite(pageNo) ? pageNo : 1,
    numOfRows: Number.isFinite(numOfRows) ? numOfRows : 12
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        source: HEALTH_FUNCTIONAL_FOOD_NUTRITION_SOURCE,
        status: result.status,
        resultCode: result.resultCode || null,
        message: "건강기능식품 영양성분 데이터 제공 중 오류가 발생했습니다."
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    source: HEALTH_FUNCTIONAL_FOOD_NUTRITION_SOURCE,
    endpoint: HEALTH_FUNCTIONAL_FOOD_NUTRITION_API_ENDPOINT,
    query: q || null,
    fallback: result.fallback || false,
    totalCount: result.totalCount,
    count: result.foods.length,
    foods: result.foods
  });
}
