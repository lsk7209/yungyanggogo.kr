# 데이터 방법론

- 원천 레코드는 기관/원천 ID/버전/기준일과 함께 보존하며 이름만으로 합치지 않는다.
- `items.item`은 배열, 단일 객체, 빈 목록을 각각 정규화한다. HTTP 200이어도 `resultCode`가 성공 코드가 아니면 실패다.
- `totalCount`는 원천 전체 건수이고 `foods.length`는 현재 페이지 항목 수다. 유효한 0은 보존하며 NaN/음수는 페이지 길이로 대체한다.
- 빈 문자열/null은 0이 아니다. 원천이 구분할 때만 reported zero, missing, not detected, trace, invalid 상태를 사용한다.
- 100g, 100ml, 1회 제공량은 서로 다른 basis다. 밀도 없이 ml를 g로 바꾸지 않는다. 0/결측 열량의 100kcal 환산은 계산하지 않는다.
- 수집 실패는 정상 빈 결과와 구분하며 마지막 정상 스냅샷을 빈 배열로 덮어쓰지 않는다.
- 현재 비교 모델은 reported/reported-zero/missing/not-detected/trace-or-below-limit/invalid를 구분하고 100g·100ml·100kcal·동일차원 섭취량을 계산한다. 원천 스키마에 영양소별 별도 basis 또는 조리 상태가 없으면 추정하지 않고 계산/집단화를 보류한다.
