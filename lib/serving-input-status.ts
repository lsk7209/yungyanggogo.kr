import { parseServingBasis } from "./nutrition-comparison";

export type ServingInputStatus =
  | { kind: "ok" }
  | { kind: "prompt"; message: string }
  | { kind: "error"; message: string };

export const SERVING_PROMPT_MESSAGE = "영양성분표의 기준량 숫자를 입력하고 단위(g 또는 ml)를 선택하면 환산 결과가 표시됩니다.";
export const SERVING_EDIT_ERROR_MESSAGE = "기준량은 0보다 큰 숫자여야 합니다. 숫자만 입력하세요. 예: 45 또는 12.5";
export const SERVING_FIXED_ERROR_MESSAGE = "이 자료는 기준량이 g 또는 ml 숫자가 아니어서 기준량 환산을 할 수 없습니다.";

// 입력 전(안내)과 잘못된 입력(오류)을 구분한다. 고정 기준량 모드는 자료 자체의 문제이므로 오류로 둔다.
export function getServingInputStatus({
  editable,
  amount,
  effectiveServing,
}: {
  editable: boolean;
  amount: string;
  effectiveServing: string;
}): ServingInputStatus {
  const valid = parseServingBasis(effectiveServing).dimension !== "unsupported";
  if (valid) return { kind: "ok" };
  if (!editable) return { kind: "error", message: SERVING_FIXED_ERROR_MESSAGE };
  if (!amount.trim()) return { kind: "prompt", message: SERVING_PROMPT_MESSAGE };
  return { kind: "error", message: SERVING_EDIT_ERROR_MESSAGE };
}
