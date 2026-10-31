import assert from "node:assert/strict";
import test from "node:test";

import { drawRandomItem } from "../src/lib/draw.ts";

test("空の候補ではundefinedを返す", () => {
  assert.equal(drawRandomItem([], () => 0.5), undefined);
});

test("乱数値に対応する候補を選ぶ", () => {
  const items = ["北", "東", "西", "南"];

  assert.equal(drawRandomItem(items, () => 0), "北");
  assert.equal(drawRandomItem(items, () => 0.49), "東");
  assert.equal(drawRandomItem(items, () => 0.999), "南");
});

test("範囲外または非数の乱数でも安全に候補を選ぶ", () => {
  const items = ["最初", "最後"];

  assert.equal(drawRandomItem(items, () => -1), "最初");
  assert.equal(drawRandomItem(items, () => 2), "最後");
  assert.equal(drawRandomItem(items, () => Number.NaN), "最初");
});
