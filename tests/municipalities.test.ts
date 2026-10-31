import assert from "node:assert/strict";
import test from "node:test";

import {
  findMunicipality,
  getMunicipalities,
  MUNICIPALITY_DATA_UPDATED_AT,
} from "../src/lib/municipalities.ts";
import { PREFECTURES } from "../src/lib/prefectures.ts";

test("全都道府県に市区町村と代表座標がある", () => {
  const allMunicipalities = PREFECTURES.flatMap(({ code }) => getMunicipalities(code));

  assert.equal(allMunicipalities.length, 1_898);
  assert.equal(new Set(allMunicipalities.map(({ code }) => code)).size, 1_898);

  for (const prefecture of PREFECTURES) {
    assert.ok(getMunicipalities(prefecture.code).length > 0, prefecture.name);
  }

  for (const municipality of allMunicipalities) {
    assert.match(municipality.code, /^\d{6}$/);
    assert.ok(municipality.name.length > 0);
    assert.ok(municipality.searchName.length > 0);
    assert.ok(Number.isFinite(municipality.latitude));
    assert.ok(Number.isFinite(municipality.longitude));
  }
});

test("都道府県と自治体コードの組み合わせだけを検索できる", () => {
  assert.deepEqual(findMunicipality("04", "041017"), {
    code: "041017",
    name: "仙台市青葉区",
    searchName: "青葉区",
    latitude: 38.269087,
    longitude: 140.870378,
  });
  assert.equal(findMunicipality("13", "041017"), undefined);
  assert.equal(findMunicipality("04", "not-a-code"), undefined);
});

test("スナップショットの更新日時を保持する", () => {
  assert.equal(MUNICIPALITY_DATA_UPDATED_AT, "2024-12-25T04:57:48.000Z");
});
