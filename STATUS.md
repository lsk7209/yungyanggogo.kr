# Status | 마지막: 2026-10-16
## 현재 작업
애드센스 승인 우선 개편(계획 .omc/plans/adsense-approval-2026-10-16.md). 1~4단계(10157eb)·2단계 공개 글 축소(c8e5a89) 배포 완료. 7단계 신뢰 문구(e8b3c05)는 커밋만, push 승인 대기. 남음: 사람 재승인, 6단계 광고 연결(신청 직전).
## 최근 변경 (최근 5개만)
- 10-18: SEO 점검 반영: Article에 author(Organization), 허브 2페이지↑ noindex,follow, 보안 헤더(nosniff·Referrer-Policy·X-Frame-Options)
- 10-18: 편집 정책 검토 문구를 실제 한 일(작성·수치 대조)로 완화(편집 7편은 사람 검토 기록 없음, approval_source=user_instruction_gg), 허브 상단에 '자료 읽는 법' 이동 링크 추가
- 10-17: 공개 식품군 9편에 '수치는 얼마나 흩어져 있는가' 절 추가(상대 폭·100kcal당 대비·먹는 양 표, scripts/lib/food-group-deep-dive.mjs). 본문 변경 → 사람 재검토 필요
- 10-17: 소개에 운영 주체(영양고고 편집팀), 편집 정책에 데이터 갱신(비정기)·검토 절차 추가(7단계). 연락 메일은 MX 미설정이나 사용자 결정으로 유지
- 10-16: 식품군 글 21편 승인 해제(비공개·404·사이트맵 제외), 공개 유지 9편(샌드위치·치킨·샐러드·과자·소스·옥수수·카레·연어·고등어). 복구는 food-group-approvals.json 항목 추가 후 build-food-group-drafts 실행
## TODO
- [ ] 광고 위치 재검토(심사 신청 전): 현재 광고 스크립트는 식품 상세에서만 로드(블로그·허브·홈 없음). 연결 확인용 스니펫 위치와 얇은 상세에 광고가 붙는 위험을 함께 결정
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
- 승인 필요: 배포, 운영 DB food_enrichments 정리, enrich 예약 워크플로우 원격 중단(파일은 삭제했으나 push 전까지 원격은 계속 실행), 캐시 재생성
- 별도 검토: lib/national-nutrition-db.ts 읽기 경로의 CREATE ... IF NOT EXISTS(멱등 DDL)
- 재심사 요청·GSC 작업은 하지 않음. lint/build는 OMC_ALLOW_LINT=1 필요(hook)
- AGENTS.md/CLAUDE.md는 upstream 추적 파일: 삭제 금지, next-env.d.ts는 git checkout으로 복원
- 10-16: v4 push 완료(c5cbda4). 사이트맵상 all/process/food 코드 겹침 0건. 피자 글 표본1개 통계 표기 수정(나머지 본문 보완·재검토는 TODO)
