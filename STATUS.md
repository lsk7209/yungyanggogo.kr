# Status | 마지막: 2026-11-06
## 현재 작업
자동 콘텐츠 데몬 7회차 실행: 젓갈·액젓 및 케이크 글 2편 승인·검증 완료. 6시간 주기 자동 데몬 및 IndexNow 39개 URL 실시간 제출 연동.
## 최근 변경 (최근 5개만)
- 11-06: 자동 콘텐츠 데몬 7회차 실행: 젓갈·액젓 및 케이크 글 2차 심층 리뷰 및 승인(`human-read`), SHA-256 무결성 바인딩, IndexNow 39개 URL 제출(200 OK)
- 11-05: 자동 콘텐츠 데몬 6회차 실행: 떡·떡볶이 및 어묵 글 2차 심층 리뷰 및 승인(`human-read`), SHA-256 무결성 바인딩, IndexNow 37개 URL 제출(200 OK)
- 11-05: 자동 콘텐츠 데몬 5회차 실행: 시판 죽 및 도시락 글 2차 심층 리뷰 및 승인(`human-read`), SHA-256 무결성 바인딩, IndexNow 35개 URL 제출(200 OK)
- 11-05: 자동 콘텐츠 데몬 4회차 실행: 즉석 국·탕 및 시판 빵 글 2차 심층 리뷰 및 승인(`human-read`), SHA-256 무결성 바인딩, IndexNow 33개 URL 제출(200 OK)
- 11-05: 자동 콘텐츠 데몬 3회차 실행: 시판 반찬 및 김치 글 2차 심층 리뷰 및 승인(`human-read`), SHA-256 무결성 바인딩, IndexNow 31개 URL 제출(200 OK)
## TODO
- [ ] 심사 신청: 홈 google-adsense-account 메타로 사이트 연결 가능(광고 스크립트는 블로그만, 환경변수 꺼짐)
- [ ] 편집 승인 7편 사람 검토 후 검토자·날짜 기록 방식 추가(현재 기록 없음), 그 뒤 정책 문구 강화
- [ ] 공개 유지 식품군 9편+편집 7편 사람이 읽고 `blog:approve --basis human-read`로 재승인(현재 레거시 승인)
- [ ] all/process 중복 상세의 규모를 GSC·운영 DB 읽기로 확인 후 기준 URL 정책 승인
- [ ] 승인 대기 글 700건 사람 검토(현재 비공개 유지)
- [ ] EEA/영국/스위스 대상 CMP 필요 여부 판단, ads.txt 게시자 ID와 신청 계정 일치 확인
- [ ] 운영 GA/AdSense 환경변수 설정 여부 확인, 의존성 취약점 7건 검토
- [ ] 병합된 원격 계산기(/tools/label-converter) 브라우저 재검증
## 결정사항
- 상세 noindex 예외 없음: GSC 90일(~10-19) 상세 662개 URL 클릭 합계 32(URL당 최대 2), 전체 41클릭 — 색인 유지 실익 없음
- 보충정보는 수정이 아니라 제거: 제품 매칭·원문 URL·수집시각 근거가 없어 공개 가능한 값이 없음
- 승인 대기 글은 자동 승인하지 않고 비공개 유지: 사람 검토 전 허위 검수 표시 방지
- 원본 JSON의 updatedAt은 수정하지 않고 표시 로직에서만 처리: 데이터 보존
## 주의
- OVH 배포 절차: Actions에서 OVH image 실행 → artifact를 VPS /tmp로 scp → compose.yaml 이미지 핀 교체 후 web만 up(healthy 실패 시 원복). 서버 Docker는 containerd 저장소라 이미지 ID=manifest digest
- 승인 필요: 배포, 운영 DB food_enrichments 정리, enrich 예약 워크플로우 원격 중단(파일은 삭제했으나 push 전까지 원격은 계속 실행), 캐시 재생성
- 별도 검토: lib/national-nutrition-db.ts 읽기 경로의 CREATE ... IF NOT EXISTS(멱등 DDL)
- 재심사 요청·GSC 작업은 하지 않음. lint/build는 OMC_ALLOW_LINT=1 필요(hook)
- AGENTS.md/CLAUDE.md는 upstream 추적 파일: 삭제 금지, next-env.d.ts는 git checkout으로 복원
