"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Clock3,
  CloudSun,
  Footprints,
  Search,
  Shirt,
  Sparkles,
  Sun,
  Thermometer,
  Umbrella,
  Wind,
  AlertCircle,
} from "lucide-react";

interface WeatherData {
  temperature: number;
  feelsLike: number;
  condition: string;
  windSpeed: number;
  uvIndex: number;
  humidity: number;
}

interface StoredRecommendation {
  id: string;
  city: string;
  createdAt: string;
  weather: WeatherData;
  recommendationText: string;
}

function formatAdvice(text: string) {
  if (!text) return null;
  const blocks = text.split("\n");

  return blocks.map((line, index) => {
    if (line.trim() === "") {
      return <div key={`gap-${index}`} className="h-3" />;
    }

    if (index === 0) {
      return (
        <p
          key={line}
          className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg"
        >
          {line}
        </p>
      );
    }

    if (
      line === "Слои одежды" ||
      line.startsWith("УФ-индекс") ||
      line === "Обувь" ||
      line === "Аксессуары" ||
      line.toLowerCase().startsWith("одежда") ||
      line.toLowerCase().startsWith("совет")
    ) {
      return (
        <p
          key={`${line}-${index}`}
          className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-sky-700"
        >
          {line}
        </p>
      );
    }

    if (line.startsWith("• ")) {
      return (
        <p key={`${line}-${index}`} className="pl-1 text-sm leading-6 text-slate-700">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-sky-500 align-middle" />
          {line.slice(2)}
        </p>
      );
    }

    if (line.startsWith("Короткий вывод:") || line.toLowerCase().startsWith("вывод:")) {
      return (
        <p
          key={`${line}-${index}`}
          className="rounded-2xl bg-sky-50 px-4 py-3 text-sm leading-6 text-slate-700 font-medium border border-sky-100"
        >
          {line}
        </p>
      );
    }

    return (
      <p key={`${line}-${index}`} className="text-sm leading-6 text-slate-600">
        {line}
      </p>
    );
  });
}

async function fetchHistory(): Promise<StoredRecommendation[]> {
  const response = await fetch("/api/recommendations");
  if (!response.ok) {
    throw new Error("Не удалось загрузить историю поиска.");
  }
  return (await response.json()) as StoredRecommendation[];
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export default function WeatherDashboard() {
  const [city, setCity] = useState("Алматы");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<StoredRecommendation | null>(null);
  const [history, setHistory] = useState<StoredRecommendation[]>([]);

  const uvLabel = useMemo(() => {
    const uv = recommendation?.weather.uvIndex ?? 0;
    if (uv >= 8) return "очень высокий";
    if (uv >= 6) return "высокий";
    if (uv >= 3) return "умеренный";
    return "низкий";
  }, [recommendation]);

  useEffect(() => {
    let cancelled = false;

    fetchHistory()
      .then((items) => {
        if (!cancelled) {
          setHistory(items);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Не удалось загрузить историю поиска."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextCity = city.trim();

    if (!nextCity) {
      setError("Введите название города, чтобы получить совет стилиста.");
      setRecommendation(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: nextCity }),
      });
      const payload = (await response.json()) as StoredRecommendation | { error?: string };

      if (!response.ok || !("weather" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Не удалось получить рекомендацию."
        );
      }

      setRecommendation(payload);
      setHistory(await fetchHistory());
      setCity("");
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось получить рекомендацию."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-3">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 bg-sky-50 px-3 py-1.5 rounded-full w-fit border border-sky-100">
          <Sparkles className="h-4 w-4 animate-pulse text-sky-500" />
          WeatherWear AI
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Умный стилист по погоде
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Укажите город — покажем текущую погоду и подробный совет по слоям,
          обуви, УФ-индексу и аксессуарам.
        </p>
      </header>

      {/* Поисковая панель */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center"
      >
        <label className="sr-only" htmlFor="city">
          Город
        </label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Например, Алматы, Москва или Dubai"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-4 pl-11 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
        >
          <Search className="h-4 w-4" />
          {isLoading ? "Ищем..." : "Найти"}
        </button>
      </form>

      {/* Ошибки */}
      {error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Главный блок с текущей рекомендацией */}
      {recommendation ? (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {/* Погода */}
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Текущая погода
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  {recommendation.city}
                </h2>
                <p className="mt-1 text-sm text-slate-500 capitalize">
                  {recommendation.weather.condition}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
                <CloudSun className="h-6 w-6" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Thermometer className="h-4 w-4 text-sky-500" />
                  Температура
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {recommendation.weather.temperature}°
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Ощущается как {recommendation.weather.feelsLike}°C
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Wind className="h-4 w-4 text-sky-500" />
                  Ветер
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {recommendation.weather.windSpeed}
                </p>
                <p className="mt-1 text-xs text-slate-400">м/с</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Sun className="h-4 w-4 text-amber-500" />
                  УФ-индекс
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {recommendation.weather.uvIndex}
                </p>
                <p className="mt-1 text-xs text-slate-400">{uvLabel}</p>
              </div>
            </div>
          </article>

          {/* Рекомендации стилиста */}
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                  AI Рекомендация стилиста
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  Что надеть сегодня
                </h2>
              </div>
              <Shirt className="h-6 w-6 text-sky-600" />
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200">
                <Shirt className="h-3.5 w-3.5 text-slate-500" />
                Слои
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200">
                <Sun className="h-3.5 w-3.5 text-slate-500" />
                УФ-индекс
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200">
                <Footprints className="h-3.5 w-3.5 text-slate-500" />
                Обувь
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200">
                <Umbrella className="h-3.5 w-3.5 text-slate-500" />
                Аксессуары
              </span>
            </div>

            <div className="space-y-1">
              {formatAdvice(recommendation.recommendationText)}
            </div>
          </article>
        </section>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center text-sm text-slate-500 shadow-sm">
          Введите город и нажмите «Найти», чтобы увидеть погоду и совет по одежде.
        </div>
      )}

      {/* История запросов */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-sky-600 animate-pulse" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              История поиска
            </p>
            <h2 className="text-xl font-bold text-slate-950">
              Прошлые запросы
            </h2>
          </div>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-slate-500">
            История пока пустая. После первого поиска запросы появятся здесь.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {history.map((item) => {
              const isActive = recommendation?.id === item.id;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setCity(item.city);
                      setRecommendation(item);
                      setError(null);
                    }}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition duration-200 shadow-sm ${
                      isActive
                        ? "border-sky-300 bg-sky-50/70"
                        : "border-slate-150 bg-slate-50 hover:border-sky-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900 truncate">{item.city}</p>
                      <p className="text-sm font-bold text-sky-700 shrink-0">{item.weather.temperature}°C</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 capitalize">
                      {item.weather.condition}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {formatTime(item.createdAt)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}