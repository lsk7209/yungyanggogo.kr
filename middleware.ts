import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 봇이 검색·필터(쿼리파라미터) URL을 대량 크롤하면 Turso reads가 폭주할 수 있으므로,
// 봇의 쿼리스트링 요청을 Edge에서 403 차단(DB 도달 전). robots보다 강제적(미준수
// 봇도 차단). 정상 사용자는 그대로 통과한다.
const BOT_UA =
  /bot|crawl|spider|slurp|Googlebot|bingbot|Bytespider|GPTBot|ClaudeBot|PerplexityBot|OAI-SearchBot|YandexBot|Baiduspider|DuckDuckBot|Yeti|Daumoa/i;

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  if (req.nextUrl.search && BOT_UA.test(ua)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  return NextResponse.next();
}

export const config = {
  // 정적 자산·API 제외한 페이지 요청에만 적용
  matcher: ["/((?!_next/|api/|favicon.ico|.*\\.).*)"],
};
