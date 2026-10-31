import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { findPrefecture, PREFECTURES } from "../src/lib/prefectures.ts";

test("47都道府県を重複なく保持する", () => {
  assert.equal(PREFECTURES.length, 47);
  assert.equal(new Set(PREFECTURES.map(({ code }) => code)).size, 47);
  assert.equal(new Set(PREFECTURES.map(({ name }) => name)).size, 47);
});

test("ホワイトリストにあるコードだけを検索できる", () => {
  assert.equal(findPrefecture("04")?.name, "宮城県");
  assert.equal(findPrefecture("48"), undefined);
  assert.equal(findPrefecture('04"]'), undefined);
});

test("Wikipedia検索起点が全都道府県をカバーする", () => {
  const searchOrigins = JSON.parse(
    readFileSync(
      new URL("../src/data/prefecture-search-origins.json", import.meta.url),
      "utf8",
    ),
  ) as Array<{ prefectureCode: string }>;
  const coveredCodes = new Set(searchOrigins.map(({ prefectureCode }) => prefectureCode));

  assert.equal(coveredCodes.size, 47);
  assert.deepEqual(
    [...coveredCodes].sort(),
    PREFECTURES.map(({ code }) => code).sort(),
  );
});
