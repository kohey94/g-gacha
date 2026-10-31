"use client";

import { useRef, useState } from "react";

import { ArrowIcon, LocationIcon, RefreshIcon, SparkIcon } from "./icons";
import { SpotVisual } from "./spot-visual";
import { drawRandomItem } from "@/lib/draw";
import { getMunicipalities } from "@/lib/municipalities";
import { PREFECTURES } from "@/lib/prefectures";
import type { SpotApiResponse, TouristSpot } from "@/lib/types";

type ViewState = "idle" | "loading" | "success" | "empty" | "error";

const NATIONAL_VALUE = "all";
const ALL_MUNICIPALITIES_VALUE = "all";
const NATIONAL_MAX_ATTEMPTS = 4;

function googleMapsUrl(spot: TouristSpot): string {
  const query = encodeURIComponent(`${spot.latitude},${spot.longitude}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

async function fetchSpots(
  prefectureCode: string,
  municipalityCode?: string,
): Promise<SpotApiResponse> {
  const searchParams = new URLSearchParams({ prefecture: prefectureCode });
  if (municipalityCode) {
    searchParams.set("municipality", municipalityCode);
  }

  const response = await fetch(`/api/spots?${searchParams}`, {
    cache: "no-store",
  });
  const data = (await response.json()) as SpotApiResponse;

  if (!response.ok) {
    throw new Error(data.error ?? "観光スポットを取得できませんでした。");
  }

  return data;
}

export function GachaExperience() {
  const [selectedCode, setSelectedCode] = useState(NATIONAL_VALUE);
  const [selectedMunicipalityCode, setSelectedMunicipalityCode] = useState(
    ALL_MUNICIPALITIES_VALUE,
  );
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [spot, setSpot] = useState<TouristSpot>();
  const [notice, setNotice] = useState<string>();
  const inFlight = useRef(false);
  const municipalities = selectedCode === NATIONAL_VALUE
    ? []
    : getMunicipalities(selectedCode);

  async function draw() {
    if (inFlight.current) {
      return;
    }

    inFlight.current = true;
    setViewState("loading");
    setNotice(undefined);

    const isNational = selectedCode === NATIONAL_VALUE;
    const municipalityCode = !isNational
      && selectedMunicipalityCode !== ALL_MUNICIPALITIES_VALUE
      ? selectedMunicipalityCode
      : undefined;
    const attempts = isNational ? NATIONAL_MAX_ATTEMPTS : 1;
    const remaining = [...PREFECTURES];
    let lastError: Error | undefined;
    let hadEmptyResult = false;

    try {
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        const prefecture = isNational
          ? drawRandomItem(remaining)
          : PREFECTURES.find((candidate) => candidate.code === selectedCode);

        if (!prefecture) {
          break;
        }

        const index = remaining.findIndex((candidate) => candidate.code === prefecture.code);
        if (index >= 0) {
          remaining.splice(index, 1);
        }

        try {
          const data = await fetchSpots(prefecture.code, municipalityCode);
          const nextSpot = drawRandomItem(data.spots);

          if (!nextSpot) {
            hadEmptyResult = true;
            console.warn(`[gacha] ${prefecture.name}: 候補が0件のため再抽選します`);
            continue;
          }

          setSpot(nextSpot);
          setNotice(data.warning);
          setViewState("success");
          return;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error("取得に失敗しました。");
          console.warn(`[gacha] ${prefecture.name}: ${lastError.message}`);
        }
      }

      setSpot(undefined);
      if (lastError) {
        setNotice(
          isNational
            ? "いくつかの地域で取得を試しましたが、旅先を選べませんでした。時間をおいてもう一度お試しください。"
            : lastError.message,
        );
        setViewState("error");
      } else if (hadEmptyResult) {
        setNotice("条件に合う観光スポットが見つかりませんでした。もう一度お試しください。");
        setViewState("empty");
      } else {
        setNotice("旅先を選べませんでした。選択内容を確認して、もう一度お試しください。");
        setViewState("error");
      }
    } finally {
      inFlight.current = false;
    }
  }

  const isLoading = viewState === "loading";

  return (
    <div className="site-shell min-h-screen text-[#173c39]">
      <div className="paper-noise" aria-hidden="true" />
      <header className="relative z-10 mx-auto flex w-full max-w-[1180px] items-center justify-between px-5 pb-5 pt-6 sm:px-8 lg:px-10 lg:pt-8">
        <a href="#main" className="group flex items-center gap-3" aria-label="ご当地ガチャ トップ">
          <span className="grid size-10 place-items-center rounded-full bg-[#173c39] text-white shadow-[0_5px_16px_rgba(23,60,57,0.18)] transition-transform group-hover:-rotate-6">
            <SparkIcon className="size-[18px]" />
          </span>
          <span>
            <span className="block font-serif text-lg font-bold tracking-[0.08em]">ご当地ガチャ</span>
            <span className="block text-[9px] font-semibold tracking-[0.25em] text-[#6f7e78]">GOTOCHI GACHA</span>
          </span>
        </a>
        <span className="hidden items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-[#6f7e78] sm:flex">
          <span className="h-px w-8 bg-[#c8bfae]" />
          47 PREFECTURES · 1 SURPRISE
        </span>
      </header>

      <main id="main" className="relative z-10 mx-auto w-full max-w-[1180px] px-5 pb-10 sm:px-8 lg:px-10 lg:pb-14">
        <div className="mb-8 grid items-end gap-6 border-y border-[#d8d0c2] py-7 md:grid-cols-[1fr_auto] lg:mb-10 lg:py-9">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#b64732]">
              <span className="block h-px w-6 bg-current" />
              偶然から、旅をはじめよう
            </p>
            <h1 className="max-w-3xl font-serif text-[clamp(2.35rem,6vw,5rem)] font-semibold leading-[1.12] tracking-[-0.04em] text-[#173c39]">
              まだ知らない日本へ。
            </h1>
          </div>
          <p className="max-w-[360px] text-sm leading-7 text-[#62716c] md:pb-1 md:text-right">
            行き先を決めずに回してみる。<br className="hidden sm:block" />
            思いがけない景色との出会いを、ひとつ。
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-7">
          <section className="control-panel flex flex-col rounded-[28px] bg-[#173c39] p-6 text-white shadow-[0_18px_50px_rgba(23,60,57,0.16)] sm:p-7 lg:min-h-[520px]">
            <div>
              <span className="inline-flex rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-[#f2c98c]">
                STEP 01
              </span>
              <h2 className="mt-5 font-serif text-2xl font-semibold tracking-[0.02em]">どこから探す？</h2>
              <p className="mt-2 text-sm leading-6 text-white/62">全国、または気になる都道府県・市区町村を選んでください。</p>
            </div>

            <label htmlFor="prefecture" className="mt-8 block text-xs font-bold tracking-[0.12em] text-white/75">
              都道府県
            </label>
            <div className="relative mt-2">
              <select
                id="prefecture"
                value={selectedCode}
                disabled={isLoading}
                onChange={(event) => {
                  setSelectedCode(event.target.value);
                  setSelectedMunicipalityCode(ALL_MUNICIPALITIES_VALUE);
                }}
                className="w-full appearance-none rounded-2xl border border-white/18 bg-white/10 px-4 py-4 pr-11 text-base font-semibold text-white outline-none transition focus:border-[#f2c98c] focus:ring-2 focus:ring-[#f2c98c]/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value={NATIONAL_VALUE} className="text-[#173c39]">全国からおまかせ</option>
                {PREFECTURES.map((prefecture) => (
                  <option key={prefecture.code} value={prefecture.code} className="text-[#173c39]">
                    {prefecture.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#f2c98c]" aria-hidden="true">⌄</span>
            </div>

            <label htmlFor="municipality" className="mt-5 block text-xs font-bold tracking-[0.12em] text-white/75">
              市区町村
            </label>
            <div className="relative mt-2">
              <select
                id="municipality"
                value={selectedMunicipalityCode}
                disabled={isLoading || selectedCode === NATIONAL_VALUE}
                onChange={(event) => setSelectedMunicipalityCode(event.target.value)}
                className="w-full appearance-none rounded-2xl border border-white/18 bg-white/10 px-4 py-4 pr-11 text-base font-semibold text-white outline-none transition focus:border-[#f2c98c] focus:ring-2 focus:ring-[#f2c98c]/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value={ALL_MUNICIPALITIES_VALUE} className="text-[#173c39]">
                  {selectedCode === NATIONAL_VALUE
                    ? "先に都道府県を選択"
                    : "市区町村すべて"}
                </option>
                {municipalities.map((municipality) => (
                  <option key={municipality.code} value={municipality.code} className="text-[#173c39]">
                    {municipality.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#f2c98c]" aria-hidden="true">⌄</span>
            </div>

            <div className="mt-auto pt-8">
              <button
                type="button"
                disabled={isLoading}
                onClick={draw}
                className="gacha-button group flex w-full items-center justify-between rounded-2xl bg-[#d95038] px-5 py-4 text-left font-bold text-white shadow-[0_10px_25px_rgba(217,80,56,0.28)] transition hover:bg-[#e15b42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2c98c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#173c39] disabled:cursor-not-allowed disabled:opacity-65"
              >
                <span className="flex items-center gap-3">
                  {isLoading ? <span className="loading-spinner" aria-hidden="true" /> : <SparkIcon className="size-5" />}
                  {isLoading ? "探しています…" : "ガチャを回す"}
                </span>
                {!isLoading && <ArrowIcon className="size-5 transition-transform group-hover:translate-x-1" />}
              </button>
              <p className="mt-4 text-center text-[10px] leading-5 text-white/45">
                {selectedCode === NATIONAL_VALUE
                  ? "全国では、まず都道府県を同じ確率で抽選します"
                  : "市区町村は任意で絞り込めます"}
              </p>
            </div>
          </section>

          <section className="result-stage min-h-[470px] overflow-hidden rounded-[28px] border border-[#d8d0c2] bg-[#fbf8f1]/90 shadow-[0_16px_45px_rgba(59,49,36,0.07)] lg:min-h-[520px]" aria-live="polite" aria-busy={isLoading}>
            {viewState === "idle" && <IdlePanel />}
            {viewState === "loading" && <LoadingPanel />}
            {(viewState === "empty" || viewState === "error") && (
              <MessagePanel kind={viewState} message={notice} onRetry={draw} />
            )}
            {viewState === "success" && spot && (
              <ResultPanel key={spot.id} spot={spot} notice={notice} onRetry={draw} />
            )}
          </section>
        </div>
      </main>

      <footer className="relative z-10 border-t border-[#d8d0c2] bg-[#eee8dc]/60">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-3 px-5 py-6 text-[11px] leading-5 text-[#6f7e78] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <p>観光情報: Wikipedia（データの欠損・偏りを含む場合があります）</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-semibold">
            <a className="underline decoration-[#a8a095] underline-offset-4 hover:text-[#173c39]" href="https://ja.wikipedia.org/wiki/Wikipedia:%E8%91%97%E4%BD%9C%E6%A8%A9" target="_blank" rel="noreferrer">
              Wikipediaのライセンス
            </a>
            <a className="underline decoration-[#a8a095] underline-offset-4 hover:text-[#173c39]" href="https://github.com/geolonia/japanese-addresses-v2" target="_blank" rel="noreferrer">
              Geolonia 住所データ（CC BY 4.0）
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function IdlePanel() {
  return (
    <div className="relative grid h-full min-h-[470px] place-items-center overflow-hidden px-7 py-12 text-center lg:min-h-[520px]">
      <div className="idle-orbit" aria-hidden="true">
        <span className="idle-orbit-dot" />
      </div>
      <div className="relative z-10 max-w-sm">
        <div className="mx-auto grid size-20 place-items-center rounded-full border border-[#d8d0c2] bg-[#f4efe5] text-[#b64732] shadow-[0_10px_30px_rgba(59,49,36,0.08)]">
          <LocationIcon className="size-8" />
        </div>
        <p className="mt-7 font-serif text-2xl font-semibold tracking-[0.03em]">次の旅先は、どこだろう。</p>
        <p className="mt-3 text-sm leading-7 text-[#6f7e78]">左のボタンを押すと、日本のどこかから<br className="hidden sm:block" />観光スポットをひとつ選びます。</p>
      </div>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="grid h-full min-h-[470px] place-items-center px-7 py-12 text-center lg:min-h-[520px]">
      <div>
        <div className="travel-loader mx-auto" aria-hidden="true">
          <span />
        </div>
        <p className="mt-8 font-serif text-2xl font-semibold">旅先候補を探しています</p>
        <p className="mt-3 text-sm text-[#6f7e78]">日本地図をめくるように、少しだけお待ちください…</p>
      </div>
    </div>
  );
}

type MessagePanelProps = {
  kind: "empty" | "error";
  message?: string;
  onRetry: () => void;
};

function MessagePanel({ kind, message, onRetry }: MessagePanelProps) {
  return (
    <div className="grid h-full min-h-[470px] place-items-center px-7 py-12 text-center lg:min-h-[520px]" role={kind === "error" ? "alert" : "status"}>
      <div className="max-w-md">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#f2e6d4] font-serif text-2xl text-[#b64732]">!</span>
        <p className="mt-6 font-serif text-2xl font-semibold">{kind === "empty" ? "候補が見つかりませんでした" : "うまく取得できませんでした"}</p>
        <p className="mt-3 text-sm leading-7 text-[#6f7e78]">{message}</p>
        <button type="button" onClick={onRetry} className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#173c39] px-5 py-3 text-sm font-bold transition hover:bg-[#173c39] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b64732] focus-visible:ring-offset-2">
          <RefreshIcon className="size-4" />
          もう一度試す
        </button>
      </div>
    </div>
  );
}

type ResultPanelProps = {
  spot: TouristSpot;
  notice?: string;
  onRetry: () => void;
};

function ResultPanel({ spot, notice, onRetry }: ResultPanelProps) {
  return (
    <article className="result-reveal grid min-h-[470px] lg:min-h-[520px] lg:grid-cols-[minmax(250px,0.92fr)_minmax(320px,1.08fr)]">
      <SpotVisual imageUrl={spot.imageUrl} name={spot.name} />
      <div className="flex flex-col p-6 sm:p-8 lg:p-9">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-[#b64732]">
            <SparkIcon className="size-3.5" />
            YOUR NEXT DESTINATION
          </span>
          <span className="font-serif text-xs text-[#9b8f7d]">No. {spot.prefectureCode}</span>
        </div>

        <div className="my-auto py-8">
          <p className="flex items-center gap-2 text-sm font-bold text-[#65756f]">
            <LocationIcon className="size-4 text-[#b64732]" />
            {spot.prefectureName}
            {spot.municipalityName && ` · ${spot.municipalityName}`}
          </p>
          <h2 className="mt-3 text-balance font-serif text-[clamp(2rem,4.6vw,3.65rem)] font-semibold leading-[1.18] tracking-[-0.035em] text-[#173c39]">{spot.name}</h2>
          <div className="mt-6 h-px w-16 bg-[#d8d0c2]" />
          <p className="mt-5 text-sm leading-7 text-[#6f7e78]">地図を開いて、周辺の景色や行き方をのぞいてみましょう。</p>
          {spot.wikipediaUrl && (
            <a
              href={spot.wikipediaUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-xs font-semibold text-[#526c67] underline decoration-[#a8a095] underline-offset-4 hover:text-[#173c39]"
            >
              Wikipediaでスポット情報を見る
            </a>
          )}
          {notice && <p className="mt-4 rounded-xl bg-[#f2e6d4] px-4 py-3 text-xs leading-5 text-[#7b5a42]">{notice}</p>}
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <a href={googleMapsUrl(spot)} target="_blank" rel="noreferrer" className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#173c39] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#24534e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b64732] focus-visible:ring-offset-2">
            Google マップで見る
            <ArrowIcon className="size-4 transition-transform group-hover:translate-x-1" />
          </a>
          <button type="button" onClick={onRetry} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cfc6b7] px-5 py-3.5 text-sm font-bold transition hover:border-[#173c39] hover:bg-[#f4efe5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b64732] focus-visible:ring-offset-2">
            <RefreshIcon className="size-4" />
            もう一度
          </button>
        </div>
      </div>
    </article>
  );
}
