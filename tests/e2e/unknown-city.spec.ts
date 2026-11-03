import { test, expect } from "@playwright/test";
import { mockRecommendations } from "./helpers";

test("unknown city displays an informative error", async ({ page }) => {
  await mockRecommendations(page, {
    postStatus: 500,
    postError: 'Город "unknowncity123" не найден',
  });
  await page.goto("/");
  await page.getByLabel("Город").fill("unknowncity123");
  await page.getByRole("button", { name: "Найти" }).click();
  await expect(page.getByText('Город "unknowncity123" не найден')).toBeVisible();
  await expect(page.getByText("Введите город и нажмите «Найти», чтобы увидеть погоду и совет по одежде.")).toBeVisible();
});

test("server errors do not crash the UI", async ({ page }) => {
  await mockRecommendations(page, { postStatus: 500, postError: "Ошибка получения погоды" });
  await page.goto("/");
  await page.getByRole("button", { name: "Найти" }).click();
  await expect(page.getByText("Ошибка получения погоды")).toBeVisible();
});
