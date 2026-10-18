import assert from "node:assert/strict";
import { classifyRecordIdentity, findSameCodePairs } from "../lib/nutrition-record-identity.ts";
import { parseComparisonSelection } from "../lib/comparison-selection.ts";

const blank = Object.fromEntries(
  ["typeName","originName","largeCategory","representativeFood","middleCategory","servingUnit","energy","water","protein","fat","carbs","sugars","fiber","calcium","iron","potassium","sodium","vitaminA","vitaminC","vitaminD","saturatedFat","transFat","maker","importer","distributor","restaurant","originCountry","sourceName","createdAt","updatedAt"].map((k) => [k, ""]),
);
const item = (over) => ({ ...blank, foodCode: "P119-900090100-0047", name: "기데티 파르미지아노 레지아노 치즈", servingUnit: "100g", energy: "398", protein: "32.00", fat: "30.00", carbs: "0.00", sugars: "0.00", sodium: "1600", ...over });

// 운영에서 확인된 사례: 같은 코드·같은 수치, 분류·제조사 메타데이터만 다름 → 동일 자료
assert.equal(classifyRecordIdentity(item({}), item({ largeCategory: "가공식품", maker: "SARCA SRL", updatedAt: "2026-09-29" })), "same-record");
// 두 번째 사례: 수치는 같고 제품명 표기만 다름
assert.equal(classifyRecordIdentity(item({ name: "급한튤립국물닭발" }), item({ name: "화각닭발 튤립국물닭발" })), "same-values-different-name");
// 같은 코드지만 값이 다르면 별개 자료
assert.equal(classifyRecordIdentity(item({}), item({ sodium: "1500" })), "different-data");
assert.equal(classifyRecordIdentity(item({}), item({ servingUnit: "50g" })), "different-data");
// 한쪽에만 값이 있으면 같은 자료로 단정하지 않음
assert.equal(classifyRecordIdentity(item({}), item({ fiber: "1" })), "different-data");
// 판정할 값이 부족하면 확인 불가
const sparse = { energy: "100", protein: "", fat: "", carbs: "", sugars: "", sodium: "" };
assert.equal(classifyRecordIdentity(item(sparse), item(sparse)), "insufficient");
// 코드가 다르면 대상 아님
assert.equal(classifyRecordIdentity(item({}), item({ foodCode: "OTHER" })), null);
// 숫자 표기 차이(32 vs 32.00, 천 단위 쉼표)는 같은 값
assert.equal(classifyRecordIdentity(item({ protein: "32" }), item({ sodium: "1,600" })), "same-record");

// 비교 선택: 데이터셋이 다르면 두 항목 모두 선택되고(막지 않음), 같은 데이터셋·같은 코드만 중복 처리
const sel = parseComparisonSelection(["all|P119-900090100-0047", "process|P119-900090100-0047", "process|P119-900090100-0047"]);
assert.equal(sel.selectedRefs.length, 2);
assert.equal(sel.duplicateCount, 1);
const pairs = findSameCodePairs([
  { value: "all|P119-900090100-0047", item: item({}) },
  { value: "process|P119-900090100-0047", item: item({ maker: "SARCA SRL" }) },
  { value: "food|X", item: item({ foodCode: "X" }) },
]);
assert.equal(pairs.length, 1);
assert.equal(pairs[0].identity, "same-record");


console.log("record identity: 12 assertions passed");
