import { test, expect } from "@playwright/test";
import { makeRecommendation, mockRecommendations } from "./helpers";

test("outfit recommendation shows weather-appropriate clothing and accessories", async ({ page }) => {
  const recommendation = makeRecommendation("Алматы", {
    weather: {
      temperature: -4,
      feelsLike: -7,
      condition: "Умеренный дождь",
      windSpeed: 7,
      uvIndex: 1,
      humidity: 90,
    },
    recommendationText:
      "Надевайте тёплый пуховик, шапку, шарф и перчатки. Возьмите с собой зонт и водонепроницаемую обувь.",
  });
  await mockRecommendations(page, { postResponse: recommendation });
  await page.goto("/");
  await page.getByRole("button", { name: "Найти" }).click();

  await expect(page.getByText(/пуховик, шапку, шарф и перчатки/)).toBeVisible();
  await expect(page.getByText(/зонт и водонепроницаемую обувь/)).toBeVisible();
});
