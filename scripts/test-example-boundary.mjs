import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('home does not present synthetic product counts as inventory', () => {
  const home = source('app/page.tsx');
  for (const count of ['128개','94개','76개','41개','312개','468개','539개','126개','284개','193개','88개','147개']) assert.ok(!home.includes(count), count);
  assert.ok(!home.includes('/foods/protein-ready-meal-sample'));
  assert.ok(home.includes('예시 데이터'));
  assert.ok(!home.includes('action="/blog"'));
  assert.ok(!home.includes('목록을 바로 확인할 수 있습니다'));
  assert.ok(!home.includes('기준 수치를 나란히'));
});

test('comparison groups cannot present the example product as ranked representative', () => {
  assert.ok(!source('lib/foods.ts').includes('productSlug:'));
  const rankings = source('app/rankings/page.tsx');
  assert.ok(!rankings.includes('대표 제품 보기'));
  assert.ok(!rankings.includes('ranking.productSlug'));
  assert.ok(rankings.includes('제품 순위가 아닙니다'));
});

test('example detail has explicit identity and omits product provenance/schema', () => {
  const detail = source('app/foods/[slug]/page.tsx');
  assert.ok(source('lib/foods.ts').includes('isExample: true'));
  assert.ok(detail.includes('food.isExample ? null :'));
  assert.ok(detail.includes('실제 식품이 아닌 화면 예시'));
  assert.ok(detail.includes('food.isExample ?'));
  assert.ok(detail.includes('index: false, follow: true'));
});

test('discovery policy follows example identity and retained blog link is labeled', () => {
  assert.ok(source('app/sitemap.ts').includes('foods.filter((food) => !food.isExample)'));
  assert.match(source('lib/blog.ts'), /href: "\/foods\/protein-ready-meal-sample",\s+label: "[^"]*예시"/);
});
