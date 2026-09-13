import { NextResponse } from "next/server";
import {
  fetchPublicFoodItems,
  FOOD_NUTRITION_API_ENDPOINT,
  getPublicDataServiceKey,
  PUBLIC_FOOD_API_SOURCE
} from "../../../lib/public-food-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const serviceKey = getPublicDataServiceKey();

  if (!serviceKey) {
    return NextResponse.json(
      {
        ok: false,
        source: PUBLIC_FOOD_API_SOURCE,
        message: "현재 공식 식품영양성분 데이터를 제공할 수 없습니다."
      },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const pageNo = searchParams.get("pageNo") || "1";
  const numOfRows = searchParams.get("numOfRows") || "20";

  const result = await fetchPublicFoodItems({ query: q, pageNo, numOfRows });
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        source: PUBLIC_FOOD_API_SOURCE,
        status: result.status,
        message: "공식 식품영양성분 데이터 제공 중 오류가 발생했습니다."
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    source: PUBLIC_FOOD_API_SOURCE,
    endpoint: FOOD_NUTRITION_API_ENDPOINT,
    query: q || null,
    count: result.foods.length,
    foods: result.foods
  });
}
