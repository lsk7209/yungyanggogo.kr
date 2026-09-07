import assert from 'node:assert/strict';

const base = process.argv[2] ?? 'http://localhost:3267';
assert.ok(['http://localhost:3267','https://yungyanggogo.kr'].includes(base), 'Unexpected target');
for (const path of ['/', '/rankings', '/foods/protein-ready-meal-sample']) {
  const response = await fetch(base + path, {signal:AbortSignal.timeout(20000)});
  assert.equal(response.status, 200, path);
  const html = await response.text();
  const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>/g, '');
  if (path === '/') {
    assert.ok(visible.includes('예시 데이터 — 실제 식품·판정·순위가 아닙니다'));
    assert.ok(!/128개|94개|76개|41개|312개|468개|539개|126개|284개|193개|88개|147개/.test(visible));
    assert.ok(!html.includes('href="/foods/protein-ready-meal-sample"'));
    assert.ok(!html.includes('action="/blog"'));
  } else if (path === '/rankings') {
    assert.ok(visible.includes('제품 순위가 아닙니다'));
    assert.ok(!visible.includes('대표 제품 보기'));
    assert.ok(!html.includes('href="/foods/protein-ready-meal-sample"'));
  } else {
    assert.ok(visible.includes('실제 식품이 아닌 화면 예시'));
    assert.ok(!visible.includes('출처 식품의약품안전처 식품영양성분DB'));
    assert.ok(!visible.includes('최종 갱신 2026-06'));
    assert.ok(/<title>[^<]*예시 데이터/.test(html));
    assert.ok(/name="robots"[^>]*content="noindex,\s*follow"/.test(html));
    const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(match => JSON.parse(match[1]));
    assert.ok(!schemas.some(schema => JSON.stringify(schema).includes('"@type":"Product"')));
  }
  console.log(JSON.stringify({url:base+path,status:200,exampleBoundary:'passed'}));
}
const sitemap = await fetch(base + '/sitemap.xml', {signal:AbortSignal.timeout(20000)});
assert.equal(sitemap.status, 200);
assert.ok(!(await sitemap.text()).includes('/foods/protein-ready-meal-sample'));
console.log('Example absent from sitemap');
