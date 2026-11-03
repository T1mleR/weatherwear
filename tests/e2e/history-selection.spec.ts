import { test, expect } from "@playwright/test";
import { makeRecommendation, mockRecommendations } from "./helpers";

test("selecting history restores an earlier recommendation without a new POST", async ({ page }) => {
  const earlier = makeRecommendation("Астана", {
    id: "22222222-2222-4222-8222-222222222222",
    recommendationText: "Сохранённый совет для Астаны",
  });
  const other = makeRecommendation("Москва", {
    id: "33333333-3333-4333-8333-333333333333",
  });
  const api = await mockRecommendations(page, { initialHistory: [other, earlier] });
  await page.goto("/");
  await page.getByRole("button", { name: /Астана/ }).click();

  await expect(page.getByRole("heading", { name: "Астана" })).toBeVisible();
  await expect(page.getByText("Сохранённый совет для Астаны")).toBeVisible();
  await expect(page.getByLabel("Город")).toHaveValue("Астана");
  expect(api.postCount()).toBe(0);
});
