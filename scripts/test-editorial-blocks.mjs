import assert from "node:assert/strict";
import { blocksFromMarkdown, sectionsFromBody } from "./lib/editorial-public-content.mjs";

const blocks = blocksFromMarkdown("짧은 글\n\n| 구분 | 값 |\n|---|---|\n| A | 0 |\n\n### 질문\n\n답변\n\n1. 첫째\n2. 둘째\n\n- 하나\n\n> 주의");
assert.deepEqual(blocks.map((block) => block.type), ["paragraph", "table", "heading", "paragraph", "list", "list", "quote"]);
assert.deepEqual(blocks[1].rows, [["A", "0"]]);
assert.equal(blocks[2].text, "질문");
assert.deepEqual(blocks[4], { type: "list", ordered: true, items: ["첫째", "둘째"] });
assert.equal(blocks[5].ordered, false);
assert.throws(() => blocksFromMarkdown("| A | B |\n|---|---|\n| 값 |"), /column count/);
assert.deepEqual(sectionsFromBody("소개\n\n## 제목\n\n짧은 설명").map((section) => section.body), [["소개"], ["짧은 설명"]]);
assert.equal(blocksFromMarkdown("<script>alert(1)</script> **굵게** [출처](https://example.test/a_b)")[0].text, "alert(1) 굵게 [출처](https://example.test/a_b)");
assert.deepEqual(blocksFromMarkdown("```text\n표시 기준량: 100g\n총내용량: 250g\n```"), [{ type: "code", text: "표시 기준량: 100g\n총내용량: 250g" }]);
assert.throws(() => blocksFromMarkdown("```\n미완성"), /Unclosed/);
console.log("editorial blocks: 10 structure, preservation and escaping assertions passed");
