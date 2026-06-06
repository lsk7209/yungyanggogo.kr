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
        endpoint: FOOD_NUTRITION_API_ENDPOINT,
        message:
          "공공데이터포털 서비스키가 서버 환경변수에 없습니다. PUBLIC_DATA_SERVICE_KEY 또는 DATA_GO_KR_SERVICE_KEY를 설정하면 실제 API 데이터를 표시합니다."
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
        message: result.message
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
