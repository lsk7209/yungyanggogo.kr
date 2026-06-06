# 영양고고

식품영양성분 pSEO 사이트를 위한 Next.js, Vercel, Turso 기반 프로젝트입니다.

## 목표

- 식품영양성분을 100g, 100ml, 100kcal 기준으로 비교합니다.
- 블로그 글은 자동 목차와 반응형 본문 레이아웃을 사용합니다.
- `/blog/`는 카드형 글 목록으로 제공합니다.
- SEO 기본 요소는 sitemap, robots, feed, canonical, OG, schema, ads.txt, llms.txt를 포함합니다.
- 콘텐츠 작성은 외부 LLM API 없이 직접 작성하고, 허위 전문가 페르소나를 사용하지 않습니다.

## 개발

```powershell
npm install
npm run dev
npm run typecheck
npm run build
```

## 환경변수

`.env.example`을 기준으로 Vercel 환경변수를 설정합니다.

- `NEXT_PUBLIC_SITE_URL`: 운영 도메인, 기본값 `https://yungyanggogo.kr`
- `NEXT_PUBLIC_GA_ID`: GA4 측정 ID
- `TURSO_DATABASE_URL`: Turso database URL
- `TURSO_AUTH_TOKEN`: Turso auth token

## 배포 후 확인

- Vercel preview URL 200 응답
- `/sitemap.xml`, `/robots.txt`, `/feed.xml`, `/ads.txt`, `/llms.txt`
- GSC sitemap 제출
- GA4 page_view 수집
- AdSense ads.txt 인식
- PageSpeed Insights mobile/desktop

## 콘텐츠 원칙

페르소나와 표현 가드레일은 `personas/yungyanggogo/persona.md`를 따릅니다.

# yungyanggogo.kr
