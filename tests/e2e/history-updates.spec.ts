import { test, expect } from "@playwright/test";
import { makeRecommendation, mockRecommendations } from "./helpers";

test("successful searches update saved history", async ({ page }) => {
  const item = makeRecommendation("Астана");
  const api = await mockRecommendations(page, {
    initialHistory: [],
    refreshedHistory: [item],
    postResponse: item,
  });
  await page.goto("/");
  await expect(page.getByText("История пока пустая. После первого поиска запросы появятся здесь.")).toBeVisible();
  await page.getByLabel("Город").fill("Астана");
  await page.getByRole("button", { name: "Найти" }).click();

  await expect(page.getByRole("button", { name: /Астана/ })).toBeVisible();
  expect(api.postCount()).toBe(1);
  expect(api.getCount()).toBeGreaterThanOrEqual(2);
});
