import searchOrigins from "../data/prefecture-search-origins.json" with { type: "json" };

type PrefectureSearchOrigin = {
  prefectureCode: string;
  latitude: number;
  longitude: number;
};

export function findPrefectureSearchOrigin(
  prefectureCode: string,
): PrefectureSearchOrigin | undefined {
  return searchOrigins.find((origin) => origin.prefectureCode === prefectureCode);
}
