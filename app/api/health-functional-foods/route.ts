import { NextResponse } from "next/server";
import {
  fetchHealthFunctionalFoodItems,
  getFoodSafetyKoreaApiKey,
  HEALTH_FUNCTIONAL_FOOD_API_ENDPOINT,
  HEALTH_FUNCTIONAL_FOOD_SERVICE_ID,
  HEALTH_FUNCTIONAL_FOOD_SOURCE
} from "../../../lib/health-functional-food-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!getFoodSafetyKoreaApiKey()) {
    return NextResponse.json(
      {
        ok: false,
        source: HEALTH_FUNCTIONAL_FOOD_SOURCE,
        endpoint: `${HEALTH_FUNCTIONAL_FOOD_API_ENDPOINT}/{key}/${HEALTH_FUNCTIONAL_FOOD_SERVICE_ID}/json/{start}/{end}`,
        message:
          "FOODSAFETYKOREA_API_KEY가 서버 환경변수에 없어 건강기능식품 품목제조신고 데이터를 표시할 수 없습니다."
      },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const start = Number(searchParams.get("start") || "1");
  const end = Number(searchParams.get("end") || "24");
  const result = await fetchHealthFunctionalFoodItems({
    query: q,
    startIdx: Number.isFinite(start) ? start : 1,
    endIdx: Number.isFinite(end) ? end : 24
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        source: HEALTH_FUNCTIONAL_FOOD_SOURCE,
        status: result.status,
        resultCode: result.resultCode || null,
        message: result.message
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    source: HEALTH_FUNCTIONAL_FOOD_SOURCE,
    endpoint: `${HEALTH_FUNCTIONAL_FOOD_API_ENDPOINT}/{key}/${HEALTH_FUNCTIONAL_FOOD_SERVICE_ID}/json/{start}/{end}`,
    query: q || null,
    totalCount: result.totalCount,
    count: result.foods.length,
    foods: result.foods
  });
}
