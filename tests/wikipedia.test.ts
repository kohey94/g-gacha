import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWikipediaSearchUrl,
  normalizeWikipediaPages,
  type WikipediaPage,
} from "../src/lib/wikipedia.ts";

const options = {
  prefectureCode: "04",
  prefectureName: "宮城県",
};

test("位置検索URLに中心座標・検索半径・取得上限を含む", () => {
  const url = new URL(buildWikipediaSearchUrl({
    latitude: 38.2682,
    longitude: 140.8694,
    limit: 120,
  }));

  assert.equal(url.origin, "https://ja.wikipedia.org");
  assert.equal(url.searchParams.get("generator"), "geosearch");
  assert.equal(url.searchParams.get("ggscoord"), "38.2682|140.8694");
  assert.equal(url.searchParams.get("ggsradius"), "10000");
  assert.equal(url.searchParams.get("ggslimit"), "120");
  assert.match(url.searchParams.get("prop") ?? "", /coordinates/);
});

test("観光に関係する記事をスポット形式へ正規化する", () => {
  const pages: WikipediaPage[] = [
    {
      pageid: 101,
      ns: 0,
      title: "仙台城",
      coordinates: [{ lat: 38.252, lon: 140.856, primary: "" }],
      terms: { description: ["宮城県仙台市にある日本の城跡"] },
    },
    {
      pageid: 102,
      ns: 0,
      title: "仙台駅",
      coordinates: [{ lat: 38.26, lon: 140.882, primary: "" }],
      terms: { description: ["宮城県仙台市にある東日本旅客鉄道の駅"] },
    },
    {
      pageid: 103,
      ns: 0,
      title: "仙台市役所",
      coordinates: [{ lat: 38.268, lon: 140.87, primary: "" }],
      terms: { description: ["日本の地方公共団体の庁舎"] },
    },
    {
      pageid: 104,
      ns: 0,
      title: "閉館した水族館",
      coordinates: [{ lat: 38.267, lon: 140.87, primary: "" }],
      terms: { description: ["宮城県にあった水族館"] },
    },
  ];

  const result = normalizeWikipediaPages(pages, options);

  assert.deepEqual(result, [
    {
      id: "wikipedia/101",
      name: "仙台城",
      prefectureCode: "04",
      prefectureName: "宮城県",
      latitude: 38.252,
      longitude: 140.856,
      wikipediaUrl: "https://ja.wikipedia.org/?curid=101",
    },
  ]);
});

test("座標欠損・範囲外・同一名称と座標の重複を除外する", () => {
  const pages: WikipediaPage[] = [
    {
      pageid: 201,
      title: "青葉山公園",
      coordinates: [{ lat: 38.256, lon: 140.856 }],
    },
    {
      pageid: 202,
      title: "青葉山公園",
      coordinates: [{ lat: 38.256, lon: 140.856 }],
    },
    { pageid: 203, title: "座標なしの博物館" },
    {
      pageid: 204,
      title: "範囲外の公園",
      coordinates: [{ lat: 120, lon: 140.8 }],
    },
  ];

  const result = normalizeWikipediaPages(pages, options);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, "wikipedia/201");
});

test("都道府県名に含まれる自然・文化キーワードを誤判定しない", () => {
  const pages: WikipediaPage[] = [
    {
      pageid: 301,
      title: "宮城ケーブルテレビ",
      coordinates: [{ lat: 38.318, lon: 141.029 }],
    },
    {
      pageid: 302,
      title: "塩竈市",
      coordinates: [{ lat: 38.314, lon: 141.021 }],
      terms: { description: ["宮城県の市"] },
    },
    {
      pageid: 303,
      title: "瑞巌寺",
      coordinates: [{ lat: 38.372, lon: 141.059 }],
      terms: { description: ["宮城県宮城郡松島町にある仏教寺院"] },
    },
  ];

  const result = normalizeWikipediaPages(pages, options);

  assert.deepEqual(result.map(({ id }) => id), ["wikipedia/303"]);
});

test("市区町村指定時は所在地が一致する記事だけを残す", () => {
  const pages: WikipediaPage[] = [
    {
      pageid: 401,
      title: "仙台市博物館",
      coordinates: [{ lat: 38.253, lon: 140.856 }],
      terms: { description: ["宮城県仙台市青葉区にある博物館"] },
    },
    {
      pageid: 402,
      title: "仙台市富沢遺跡保存館",
      coordinates: [{ lat: 38.219, lon: 140.87 }],
      terms: { description: ["宮城県仙台市太白区にある博物館"] },
    },
  ];

  const result = normalizeWikipediaPages(pages, {
    ...options,
    municipalityName: "仙台市青葉区",
    municipalitySearchName: "青葉区",
  });

  assert.deepEqual(result.map(({ id }) => id), ["wikipedia/401"]);
  assert.equal(result[0]?.municipalityName, "仙台市青葉区");
});
