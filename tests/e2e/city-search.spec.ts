import { test, expect } from "@playwright/test";
import { makeRecommendation, mockRecommendations } from "./helpers";

test("a city search shows weather and recommendation", async ({ page }) => {
  const item = makeRecommendation("Алматы");
  await mockRecommendations(page, {
    postResponse: item,
    refreshedHistory: [item],
  });

  await page.goto("/");
  await page.getByLabel("Город").fill("Алматы");
  await page.getByRole("button", { name: "Найти" }).click();

  await expect(page.getByText("Текущая погода")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Алматы" })).toBeVisible();
  await expect(page.getByText("Что надеть сегодня")).toBeVisible();
  await expect(page.getByText(/Отличный выбор — лёгкая куртка/)).toBeVisible();
});
