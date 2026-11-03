import { test, expect } from "@playwright/test";
import { mockRecommendations } from "./helpers";

test("blank city is rejected before sending an API request", async ({ page }) => {
  const api = await mockRecommendations(page);
  await page.goto("/");
  await page.getByLabel("Город").fill("    ");
  await page.getByRole("button", { name: "Найти" }).click();

  await expect(page.getByText("Введите название города, чтобы получить совет стилиста.")).toBeVisible();
  expect(api.postCount()).toBe(0);
});
