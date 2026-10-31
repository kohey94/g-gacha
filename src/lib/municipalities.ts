import municipalitySnapshot from "../data/municipalities.json" with { type: "json" };

import type { Municipality } from "./types";

type MunicipalityTuple = [
  code: string,
  name: string,
  searchName: string,
  latitude: number,
  longitude: number,
];

const municipalityTuples = municipalitySnapshot.municipalities as unknown as Record<
  string,
  MunicipalityTuple[]
>;

const municipalities = Object.fromEntries(
  Object.entries(municipalityTuples).map(([prefectureCode, entries]) => [
    prefectureCode,
    entries.map(([code, name, searchName, latitude, longitude]) => ({
      code,
      name,
      searchName,
      latitude,
      longitude,
    } satisfies Municipality)),
  ]),
) as Record<string, Municipality[]>;

export const MUNICIPALITY_DATA_UPDATED_AT = municipalitySnapshot.updatedAt;

export function getMunicipalities(prefectureCode: string): readonly Municipality[] {
  return municipalities[prefectureCode] ?? [];
}

export function findMunicipality(
  prefectureCode: string,
  municipalityCode: string,
): Municipality | undefined {
  return municipalities[prefectureCode]?.find(
    (municipality) => municipality.code === municipalityCode,
  );
}
