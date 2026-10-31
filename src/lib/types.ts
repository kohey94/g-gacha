export type Prefecture = {
  code: string;
  name: string;
};

export type Municipality = {
  code: string;
  name: string;
  searchName: string;
  latitude: number;
  longitude: number;
};

export type TouristSpot = {
  id: string;
  name: string;
  prefectureCode: string;
  prefectureName: string;
  municipalityName?: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  wikipediaUrl?: string;
};

export type SpotDataSource = "wikipedia";

export type SpotApiResponse = {
  spots: TouristSpot[];
  source: SpotDataSource;
  warning?: string;
  error?: string;
};
