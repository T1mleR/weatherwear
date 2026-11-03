import { test, expect } from "@playwright/test";
import { makeRecommendation, mockRecommendations } from "./helpers";

test("submit is disabled while request is pending and recovers", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await mockRecommendations(page, {
    postGate: gate,
    postResponse: makeRecommendation(),
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Найти" }).click();

  await expect(page.getByRole("button", { name: "Ищем..." })).toBeDisabled();
  release();
  await expect(page.getByRole("button", { name: "Найти" })).toBeEnabled();
  await expect(page.getByText("Что надеть сегодня")).toBeVisible();
});

test("a network failure displays an error and restores the search button", async ({ page }) => {
  await mockRecommendations(page, { postAbort: true });
  await page.goto("/");
  await page.getByRole("button", { name: "Найти" }).click();
  await expect(page.getByText(/Failed to fetch|fetch failed|Не удалось|Ошибка/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Найти" })).toBeEnabled();
});
