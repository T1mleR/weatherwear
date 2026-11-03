import { test, expect } from "@playwright/test";
import { makeRecommendation, mockRecommendations } from "./helpers";

test("weather card displays temperature, feels-like, wind and UV", async ({ page }) => {
  await mockRecommendations(page, {
    postResponse: makeRecommendation("Астана", {
      weather: {
        temperature: 3,
        feelsLike: 0,
        condition: "Ясно",
        windSpeed: 4,
        uvIndex: 8,
        humidity: 55,
      },
    }),
  });
  await page.goto("/");
  await page.getByLabel("Город").fill("Астана");
  await page.getByRole("button", { name: "Найти" }).click();

  await expect(page.getByRole("heading", { name: "Астана" })).toBeVisible();
  await expect(page.getByText("3°", { exact: true })).toBeVisible();
  await expect(page.getByText("Ощущается как 0°C")).toBeVisible();
  await expect(page.getByText("м/с")).toBeVisible();
  await expect(page.getByText("очень высокий")).toBeVisible();
});
