// 계산기 기준량 입력 상태: 최초 진입(안내) / 잘못된 입력(오류) / 정상 입력(해제)을 구분한다.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const url = new URL(specifier, context.parentURL);
      for (const extension of [".ts", ".tsx"]) {
        if (existsSync(fileURLToPath(url) + extension)) return nextResolve(url.href + extension, context);
      }
    }
    return nextResolve(specifier, context);
  },
});

const { getServingInputStatus, SERVING_PROMPT_MESSAGE, SERVING_EDIT_ERROR_MESSAGE, SERVING_FIXED_ERROR_MESSAGE } =
  await import("../lib/serving-input-status.ts");

const status = (editable, amount, unit = "g") =>
  getServingInputStatus({ editable, amount, effectiveServing: editable ? `${amount}${unit}` : amount });

let checks = 0;
const eq = (actual, expected) => { assert.deepEqual(actual, expected); checks += 1; };

// 도구 모드: 최초 진입은 오류가 아니라 중립 안내
eq(status(true, ""), { kind: "prompt", message: SERVING_PROMPT_MESSAGE });
eq(status(true, "   "), { kind: "prompt", message: SERVING_PROMPT_MESSAGE });
// 잘못된 입력은 구체적인 오류
for (const bad of ["abc", "0", "-5", "1,2", "4 5", "."]) {
  eq(status(true, bad), { kind: "error", message: SERVING_EDIT_ERROR_MESSAGE });
}
// 정상 입력으로 수정하면 해제 (소수·ml 포함)
eq(status(true, "45"), { kind: "ok" });
eq(status(true, "12.5"), { kind: "ok" });
eq(status(true, "200", "ml"), { kind: "ok" });
eq(status(true, "1,306", "g"), { kind: "ok" });

// 상세페이지 고정 기준량 모드: 자료 문제는 오류, 정상은 해제
eq(status(false, "100g"), { kind: "ok" });
eq(status(false, "200ml"), { kind: "ok" });
eq(status(false, "1회 제공량"), { kind: "error", message: SERVING_FIXED_ERROR_MESSAGE });
eq(status(false, ""), { kind: "error", message: SERVING_FIXED_ERROR_MESSAGE });

// 안내 문구는 실제 입력 방식(숫자 입력칸 + 단위 선택)과 일치해야 한다
assert.ok(!/\d+(g|ml)\b/.test(SERVING_EDIT_ERROR_MESSAGE.replace(/예:.*/, "")), "오류 안내에 단위를 붙여 입력하라는 문구가 없어야 함");
assert.ok(/숫자만 입력/.test(SERVING_EDIT_ERROR_MESSAGE) && /단위/.test(SERVING_PROMPT_MESSAGE));
checks += 2;

// 컴포넌트가 !servingValid 같은 무조건 경고 조건 대신 공통 판정을 쓴다
const component = readFileSync(new URL("../components/NutritionBasisCalculator.tsx", import.meta.url), "utf8");
assert.ok(component.includes("getServingInputStatus"));
assert.ok(!component.includes("!servingValid"));
checks += 2;

console.log(`serving input status: ${checks} checks passed`);
