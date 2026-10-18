# Status | 마지막: 2026-10-19
## 현재 작업
애드센스 승인 우선 개편(계획 .omc/plans/adsense-approval-2026-10-16.md). 1~4단계(10157eb)·2단계 공개 글 축소(c8e5a89) 배포 완료. 7단계 신뢰 문구(e8b3c05)는 커밋만, push 승인 대기. 남음: 사람 재승인, 6단계 광고 연결(신청 직전).
## 최근 변경 (최근 5개만)
- 10-19: 식품군 허브 색인 기준 5→10개(MIN_INDEXABLE_GROUP_SIZE, 운영 154개 중 67개 제외 예상), 홈에 google-adsense-account 메타(광고 없이 사이트 연결)
- 10-18: 데이터 상세 약 4,750개 noindex,follow + 사이트맵 제외(lib/sitemap-config.ts INDEX_NUTRITION_DETAILS=false, 되돌리기는 true). 커밋만, push 대기
- 10-18: 광고 스크립트 대상을 식품 상세 → 블로그 글로 이동(환경변수 꺼짐 유지), 개인정보 처리방침 문구 맞춤
- 10-18: SEO 점검 반영: Article에 author(Organization), 허브 2페이지↑ noindex,follow, 보안 헤더(nosniff·Referrer-Policy·X-Frame-Options)
- 10-18: 편집 정책 검토 문구를 실제 한 일(작성·수치 대조)로 완화(편집 7편은 사람 검토 기록 없음, approval_source=user_instruction_gg), 허브 상단에 '자료 읽는 법' 이동 링크 추가
## TODO
- [ ] OVH 재배포: E:/server-ovhcloud/.goal-harness/yungyanggogo-redeploy-6f62051-20261018 BLOCKED(VPS 메모리 3GiB<4GiB·디스크 8GiB<10GiB). 운영은 05a7f26 이미지. 용량 확보 후 최신 main 재배포
- [ ] GSC에서 상세 URL 중 클릭 있는 것 확인 → 필요 시 예외 색인
- [ ] 심사 신청: 홈 google-adsense-account 메타로 사이트 연결 가능(광고 스크립트는 블로그만, 환경변수 꺼짐)
- [ ] 편집 승인 7편 사람 검토 후 검토자·날짜 기록 방식 추가(현재 기록 없음), 그 뒤 정책 문구 강화
- [ ] 공개 유지 식품군 9편+편집 7편 사람이 읽고 `blog:approve --basis human-read`로 재승인(현재 레거시 승인)
- [ ] all/process 중복 상세의 규모를 GSC·운영 DB 읽기로 확인 후 기준 URL 정책 승인
- [ ] 승인 대기 글 700건 사람 검토(현재 비공개 유지)
- [ ] EEA/영국/스위스 대상 CMP 필요 여부 판단, ads.txt 게시자 ID와 신청 계정 일치 확인
- [ ] 운영 GA/AdSense 환경변수 설정 여부 확인, 의존성 취약점 7건 검토
- [ ] 병합된 원격 계산기(/tools/label-converter) 브라우저 재검증
## 결정사항
- 보충정보는 수정이 아니라 제거: 제품 매칭·원문 URL·수집시각 근거가 없어 공개 가능한 값이 없음
- 승인 대기 글은 자동 승인하지 않고 비공개 유지: 사람 검토 전 허위 검수 표시 방지
- 원본 JSON의 updatedAt은 수정하지 않고 표시 로직에서만 처리: 데이터 보존
## 주의
- 운영 도메인 DNS는 51.79.206.71(OVH, Caddy)이고 Vercel 배포도 별도로 Ready 상태. 10-18 푸시(7dfbfd5·fd674c5: Article author, 허브 2페이지↑ noindex, 보안 헤더)가 15분↑ 운영에 미반영 — OVH 배포 방식 확인 필요
- 승인 필요: 배포, 운영 DB food_enrichments 정리, enrich 예약 워크플로우 원격 중단(파일은 삭제했으나 push 전까지 원격은 계속 실행), 캐시 재생성
- 별도 검토: lib/national-nutrition-db.ts 읽기 경로의 CREATE ... IF NOT EXISTS(멱등 DDL)
- 재심사 요청·GSC 작업은 하지 않음. lint/build는 OMC_ALLOW_LINT=1 필요(hook)
- AGENTS.md/CLAUDE.md는 upstream 추적 파일: 삭제 금지, next-env.d.ts는 git checkout으로 복원
- 10-16: v4 push 완료(c5cbda4). 사이트맵상 all/process/food 코드 겹침 0건. 피자 글 표본1개 통계 표기 수정(나머지 본문 보완·재검토는 TODO)
