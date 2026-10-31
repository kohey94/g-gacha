import type { TouristSpot } from "./types";

export type WikipediaPage = {
  pageid: number;
  ns?: number;
  title: string;
  coordinates?: Array<{
    lat?: number;
    lon?: number;
    primary?: string;
  }>;
  terms?: {
    description?: string[];
  };
};

type WikipediaSearchOptions = {
  latitude: number;
  longitude: number;
  limit?: number;
};

type NormalizeOptions = {
  prefectureCode: string;
  prefectureName: string;
  municipalityName?: string;
  municipalitySearchName?: string;
};

const TOURISM_KEYWORDS = [
  "観光",
  "名所",
  "景勝",
  "世界遺産",
  "文化財",
  "史跡",
  "遺跡",
  "古墳",
  "城",
  "神社",
  "寺",
  "仏閣",
  "教会",
  "庭園",
  "公園",
  "博物館",
  "美術館",
  "資料館",
  "記念館",
  "動物園",
  "水族館",
  "植物園",
  "展望",
  "タワー",
  "温泉",
  "テーマパーク",
  "遊園地",
] as const;

const NATURAL_FEATURE_KEYWORDS = [
  "山",
  "岳",
  "湖",
  "沼",
  "滝",
  "海岸",
  "岬",
  "島",
  "渓谷",
  "峡谷",
  "浜",
  "洞窟",
] as const;

const EXCLUDED_DESCRIPTION_KEYWORDS = [
  "鉄道駅",
  "鉄道の駅",
  "旅客鉄道",
  "バス停",
  "道路",
  "インターチェンジ",
  "パーキングエリア",
  "サービスエリア",
  "学校",
  "病院",
  "警察署",
  "消防署",
  "郵便局",
  "企業",
  "人物",
  "政治家",
  "選挙区",
  "放送局",
  "町丁",
  "地名",
  "大字",
  "地方公共団体",
  "小惑星",
  "にあった",
  "かつて存在した",
] as const;

const EXCLUDED_TITLE_KEYWORDS = [
  "インターチェンジ",
  "パーキングエリア",
  "サービスエリア",
] as const;

const EXCLUDED_TITLE_SUFFIXES = [
  "駅",
  "郵便局",
  "警察署",
  "消防署",
  "学校",
  "病院",
  "市役所",
  "区役所",
  "町役場",
  "村役場",
  "グラウンド",
  "スタジアム",
] as const;

function isTourismCandidate(
  name: string,
  description: string,
  prefectureName: string,
): boolean {
  if (
    EXCLUDED_TITLE_KEYWORDS.some((keyword) => name.includes(keyword)) ||
    EXCLUDED_TITLE_SUFFIXES.some((suffix) => name.endsWith(suffix)) ||
    EXCLUDED_DESCRIPTION_KEYWORDS.some((keyword) => description.includes(keyword)) ||
    /の(?:市|町|村|区)$/.test(description)
  ) {
    return false;
  }

  const prefectureBaseName = prefectureName.replace(/[都道府県]$/, "");
  const sanitizedName = name
    .replaceAll(prefectureName, "")
    .replaceAll(prefectureBaseName, "");
  const sanitizedDescription = description
    .replaceAll(prefectureName, "")
    .replaceAll(prefectureBaseName, "");
  const searchableText = `${sanitizedName} ${sanitizedDescription}`;

  return (
    TOURISM_KEYWORDS.some((keyword) => searchableText.includes(keyword)) ||
    NATURAL_FEATURE_KEYWORDS.some(
      (keyword) => sanitizedName.endsWith(keyword) || sanitizedDescription.includes(keyword),
    )
  );
}

export function buildWikipediaSearchUrl({
  latitude,
  longitude,
  limit = 100,
}: WikipediaSearchOptions): string {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "geosearch",
    ggscoord: `${latitude}|${longitude}`,
    ggsradius: "10000",
    ggslimit: String(Math.min(Math.max(Math.trunc(limit), 1), 500)),
    ggsnamespace: "0",
    ggsprimary: "primary",
    prop: "coordinates|pageterms",
    colimit: "max",
    coprimary: "primary",
    wbptterms: "description",
  });

  return `https://ja.wikipedia.org/w/api.php?${params.toString()}`;
}

export function normalizeWikipediaPages(
  pages: readonly WikipediaPage[],
  options: NormalizeOptions,
): TouristSpot[] {
  const seen = new Set<string>();
  const spots: TouristSpot[] = [];

  for (const page of pages) {
    const name = page.title.trim();
    const coordinate = page.coordinates?.find(({ primary }) => primary === "")
      ?? page.coordinates?.[0];
    const latitude = coordinate?.lat;
    const longitude = coordinate?.lon;
    const description = page.terms?.description?.join(" ") ?? "";
    const locationText = `${name} ${description}`;
    const isInMunicipality = !options.municipalityName || [
      options.municipalityName,
      options.municipalitySearchName,
    ].some((locationName) => locationName && locationText.includes(locationName));

    if (
      page.ns !== undefined &&
      page.ns !== 0
    ) {
      continue;
    }

    if (
      !name ||
      !Number.isInteger(page.pageid) ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude === undefined ||
      longitude === undefined ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180 ||
      !isInMunicipality ||
      !isTourismCandidate(name, description, options.prefectureName)
    ) {
      continue;
    }

    const dedupeKey = `${name.toLocaleLowerCase("ja-JP")}|${latitude.toFixed(5)}|${longitude.toFixed(5)}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);

    spots.push({
      id: `wikipedia/${page.pageid}`,
      name,
      prefectureCode: options.prefectureCode,
      prefectureName: options.prefectureName,
      ...(options.municipalityName
        ? { municipalityName: options.municipalityName }
        : {}),
      latitude,
      longitude,
      wikipediaUrl: `https://ja.wikipedia.org/?curid=${page.pageid}`,
    });
  }

  return spots;
}
