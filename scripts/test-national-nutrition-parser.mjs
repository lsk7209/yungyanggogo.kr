import assert from "node:assert/strict";
import { extractStandardDataGoKrItems } from "../lib/data-go-kr-response.ts";

const arrayEnvelope = {
  response: {
    header: { resultCode: "00", resultMsg: "NORMAL SERVICE" },
    body: { totalCount: "120", items: { item: [{ foodCd: "A" }, { foodCd: "B" }] } }
  }
};
const singleEnvelope = {
  response: {
    header: { resultCode: "00", resultMsg: "NORMAL SERVICE" },
    body: { totalCount: 1, items: { item: { foodCd: "ONLY" } } }
  }
};
const emptyEnvelope = {
  response: {
    header: { resultCode: "00", resultMsg: "NORMAL SERVICE" },
    body: { totalCount: 0, items: { item: [] } }
  }
};
const upstreamFailure = {
  response: {
    header: { resultCode: "30", resultMsg: "SERVICE KEY IS NOT REGISTERED" },
    body: { totalCount: 0, items: { item: [] } }
  }
};

for (const name of ["national", "health-functional-nutrition"]) {
  const extract = extractStandardDataGoKrItems;
  const arrayResult = extract(arrayEnvelope);
  assert.equal(arrayResult.rows.length, 2, `${name}: items.item array`);
  assert.equal(arrayResult.totalCount, 120, `${name}: totalCount is not page length`);

  const singleResult = extract(singleEnvelope);
  assert.equal(singleResult.rows.length, 1, `${name}: items.item object`);
  assert.equal(singleResult.rows[0].foodCd, "ONLY", `${name}: object value preserved`);

  const emptyResult = extract(emptyEnvelope);
  assert.equal(emptyResult.rows.length, 0, `${name}: empty result`);
  assert.equal(emptyResult.totalCount, 0, `${name}: zero totalCount preserved`);

  const failureResult = extract(upstreamFailure);
  assert.equal(failureResult.resultCode, "30", `${name}: upstream error code preserved`);
  assert.equal(failureResult.resultMessage, "SERVICE KEY IS NOT REGISTERED", `${name}: upstream error message preserved`);
}

console.log("nutrition parser fixtures: 12 assertions passed");
