# Status | 마지막: 2026-10-16
## 현재 작업
애드센스 심사 준비 재검토 1~6 완료. push(bb987f2)와 운영 읽기 전용 확인(12건)까지 끝남.
## 최근 변경 (최근 5개만)
- 10-16: 공개 조건 fail-closed(approved/seed만), 수정일 표시 분리, 내부 표현 제거
- 10-16: 개인정보처리방침에 광고 쿠키·맞춤 광고 해제·Google 데이터 사용 안내 추가
- 10-16: 건기식 페이지를 "신고정보 확인 방법과 데이터 미리보기"로 정정
- 10-16: 원격 38 commit과 rebase 병합(계산기는 원격 것 사용), 회귀 42개·HTTP 계약 208 통과
- 10-16: push 완료, 운영 반영 확인. 보고서 docs/quality/adsense-review-2026-10-16.md
## TODO
- [ ] 승인 대기 글 700건 사람 검토(현재 비공개 유지)
- [ ] EEA/영국/스위스 대상 CMP 필요 여부 판단, ads.txt 게시자 ID와 신청 계정 일치 확인
- [ ] 운영 GA/AdSense 환경변수 설정 여부 확인, 의존성 취약점 7건 검토
- [ ] 병합된 원격 계산기(/tools/label-converter) 브라우저 재검증
## 결정사항
- 승인 대기 글은 자동 승인하지 않고 비공개 유지: 사람 검토 전 허위 검수 표시 방지
- 원본 JSON의 updatedAt은 수정하지 않고 표시 로직에서만 처리: 데이터 보존
## 주의
- 재심사 요청·GSC 작업은 하지 않음. lint/build는 OMC_ALLOW_LINT=1 필요(hook)
- AGENTS.md/CLAUDE.md는 upstream 추적 파일: 삭제 금지, next-env.d.ts는 git checkout으로 복원
