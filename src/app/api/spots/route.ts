import { NextRequest, NextResponse } from "next/server";

import { findMunicipality } from "@/lib/municipalities";
import { findPrefecture } from "@/lib/prefectures";
import { findPrefectureSearchOrigin } from "@/lib/prefecture-search-origins";
import type { Municipality, SpotApiResponse, TouristSpot } from "@/lib/types";
import {
  buildWikipediaSearchUrl,
  normalizeWikipediaPages,
  type WikipediaPage,
} from "@/lib/wikipedia";

export const runtime = "nodejs";

const WIKIPEDIA_ENDPOINT_TIMEOUT_MS = 6_000;
const CACHE_TTL_MS = 30 * 60 * 1000;

type CacheEntry = {
  expiresAt: number;
  spots: TouristSpot[];
};

const spotCache = new Map<string, CacheEntry>();

function json(
  body: SpotApiResponse,
  status = 200,
): NextResponse<SpotApiResponse> {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=1800, stale-while-revalidate=300",
    },
  });
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
  providerName: string,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`${providerName} request timed out`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWikipediaSpots(
  prefectureCode: string,
  prefectureName: string,
  userAgent: string,
  municipality?: Municipality,
): Promise<TouristSpot[]> {
  const prefectureSearchOrigin = findPrefectureSearchOrigin(prefectureCode);
  const searchOrigin = municipality ?? prefectureSearchOrigin;
  if (!searchOrigin) {
    return [];
  }

  const response = await fetchWithTimeout(
    buildWikipediaSearchUrl({
      latitude: searchOrigin.latitude,
      longitude: searchOrigin.longitude,
    }),
    {
      headers: {
        Accept: "application/json",
        "User-Agent": userAgent,
      },
      cache: "no-store",
    },
    WIKIPEDIA_ENDPOINT_TIMEOUT_MS,
    "Wikipedia API",
  );

  if (!response.ok) {
    throw new Error(`Wikipedia API returned ${response.status}`);
  }

  const payload = (await response.json()) as {
    error?: { code?: string; info?: string };
    query?: { pages?: WikipediaPage[] };
  };

  if (payload.error) {
    throw new Error(
      `Wikipedia API returned ${payload.error.code ?? payload.error.info ?? "an error"}`,
    );
  }

  return normalizeWikipediaPages(payload.query?.pages ?? [], {
    prefectureCode,
    prefectureName,
    municipalityName: municipality?.name,
    municipalitySearchName: municipality?.searchName,
  });
}

export async function GET(request: NextRequest) {
  const prefectureCode = request.nextUrl.searchParams.get("prefecture") ?? "";
  const municipalityCode = request.nextUrl.searchParams.get("municipality") ?? "";
  const prefecture = findPrefecture(prefectureCode);

  if (!prefecture) {
    return json(
      {
        spots: [],
        source: "wikipedia",
        error: "都道府県コードが正しくありません。",
      },
      400,
    );
  }

  const municipality = municipalityCode
    ? findMunicipality(prefecture.code, municipalityCode)
    : undefined;

  if (municipalityCode && !municipality) {
    return json(
      {
        spots: [],
        source: "wikipedia",
        error: "市区町村コードが正しくありません。",
      },
      400,
    );
  }

  const cacheKey = `${prefecture.code}:${municipality?.code ?? "all"}`;
  const areaName = municipality
    ? `${prefecture.name}${municipality.name}`
    : prefecture.name;
  const cached = spotCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return json({
      spots: cached.spots,
      source: "wikipedia",
    });
  }

  try {
    const configuredUserAgent = process.env.WIKIMEDIA_USER_AGENT?.trim();
    const userAgent = configuredUserAgent
      || `gotochi-gacha/0.1 (${request.nextUrl.origin}) Next.js`;
    const spots = await fetchWikipediaSpots(
      prefecture.code,
      prefecture.name,
      userAgent,
      municipality,
    );

    if (spots.length > 0) {
      spotCache.set(cacheKey, {
        spots,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      return json({ spots, source: "wikipedia" });
    }

    console.warn(`[spots] ${areaName}: Wikipedia API returned no tourist candidates`);
    return json(
      {
        spots: [],
        source: "wikipedia",
        error: `${municipality?.name ?? prefecture.name}の観光スポットがWikipediaで見つかりませんでした。`,
      },
      404,
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn(`[spots] ${areaName}: Wikipedia API failed (${detail})`);
    return json(
      {
        spots: [],
        source: "wikipedia",
        error: "Wikipediaから観光スポットを取得できませんでした。時間をおいてお試しください。",
      },
      502,
    );
  }
}
