import type { Page } from "@playwright/test";

export type Recommendation = {
  id: string;
  city: string;
  createdAt: string;
  weather: {
    temperature: number;
    feelsLike: number;
    condition: string;
    windSpeed: number;
    uvIndex: number;
    humidity: number;
  };
  recommendationText: string;
};

export function makeRecommendation(
  city = "Алматы",
  overrides: Partial<Recommendation> = {}
): Recommendation {
  const base: Recommendation = {
    id: "11111111-1111-4111-8111-111111111111",
    city,
    createdAt: "2026-11-03T07:00:00.000Z",
    weather: {
      temperature: 16,
      feelsLike: 14,
      condition: "Ясно",
      windSpeed: 3,
      uvIndex: 2,
      humidity: 50,
    },
    recommendationText: "Отличный выбор — лёгкая куртка, худи или ветровка.",
  };
  return { ...base, ...overrides, weather: { ...base.weather, ...overrides.weather } };
}

type MockOptions = {
  initialHistory?: Recommendation[];
  refreshedHistory?: Recommendation[];
  postResponse?: Recommendation;
  postStatus?: number;
  postError?: string;
  postAbort?: boolean;
  postGate?: Promise<void>;
};

export async function mockRecommendations(page: Page, options: MockOptions = {}) {
  let posts = 0;
  let gets = 0;
  await page.route("**/api/recommendations", async (route) => {
    if (route.request().method() === "GET") {
      gets += 1;
      const body = gets === 1
        ? options.initialHistory ?? []
        : options.refreshedHistory ?? options.initialHistory ?? [];
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
      return;
    }
    if (route.request().method() === "POST") {
      posts += 1;
      if (options.postGate) await options.postGate;
      if (options.postAbort) {
        await route.abort("failed");
        return;
      }
      if (options.postStatus && options.postStatus >= 400) {
        await route.fulfill({
          status: options.postStatus,
          contentType: "application/json",
          body: JSON.stringify({ error: options.postError ?? "Ошибка получения погоды" }),
        });
      } else {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(options.postResponse ?? makeRecommendation()),
        });
      }
      return;
    }
    await route.continue();
  });
  return { postCount: () => posts, getCount: () => gets };
}
