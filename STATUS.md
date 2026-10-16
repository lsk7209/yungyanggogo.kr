# Status | 마지막: 2026-10-16
## 현재 작업
3db381b까지 push 완료(origin/main 일치), 운영 반영 여부는 배포 승인 대기.
v4 점검(중복 상세·광고 대상·승인 지문·lastmod) 작업 사본 수정 완료, 미커밋. 보고서: docs/audits/adsense-v4-2026-10-16.md
## 최근 변경 (최근 5개만)
- 10-16: 공개 글 주소 phase6t-* 6건 → 제목 기반 주소+308 리디렉션(lib/blog-slug-redirects.ts, 미커밋). 원본은 promote 스크립트가 재생성하므로 매핑은 거기서 적용
- 10-16: 식품군 글 9편 보완(100kcal당 표·표본 부족·업체 편중), 데이터셋 허브 '자료 읽는 법' 추가(미커밋). 9편은 기존 승인 유지·본문만 변경 → 사람 재검토 필요
- 10-16: 색인 기준 공통화(lib/indexable-record.ts): 핵심 영양 6종 중 3개 미만 상세는 사이트맵 제외+noindex, 광고 기준과 동일(미커밋, 계획 .omc/plans/adsense-approval-2026-10-16.md 1단계)
- 10-16: 동일 식품코드 판정기+/compare 안내, 광고 요청 자료 충분성 조건, 승인 원고 지문, core 사이트맵 고정 lastmod 제거(미커밋)
- 10-16: 식품군 경로 비교 상태 유지, 단일 분류기로 사이트맵·본문·링크 공개 판단 통일, 상세 원자료 기준일/저장 시각/성분별 n 표시
## TODO
- [ ] 식품군 30편 사람 검토 근거 확인(승인 커밋은 자동 대조만 기재), 보완 후보 반영 여부 결정
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
- 승인 필요: 배포, 운영 DB food_enrichments 정리, enrich 예약 워크플로우 원격 중단(파일은 삭제했으나 push 전까지 원격은 계속 실행), 캐시 재생성
- 별도 검토: lib/national-nutrition-db.ts 읽기 경로의 CREATE ... IF NOT EXISTS(멱등 DDL)
- 재심사 요청·GSC 작업은 하지 않음. lint/build는 OMC_ALLOW_LINT=1 필요(hook)
- AGENTS.md/CLAUDE.md는 upstream 추적 파일: 삭제 금지, next-env.d.ts는 git checkout으로 복원
- 10-16: v4 push 완료(c5cbda4). 사이트맵상 all/process/food 코드 겹침 0건. 피자 글 표본1개 통계 표기 수정(나머지 본문 보완·재검토는 TODO)
