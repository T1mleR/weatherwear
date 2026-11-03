import assert from "node:assert/strict";
import test from "node:test";
import { generateRecommendation } from "../../services/recommendationService.ts";

const weather = {
  city: "Тестовый город",
  temperature: 12,
  feelsLike: 10,
  condition: "Ясно",
  windSpeed: 2,
  uvIndex: 2,
  humidity: 50,
};

test("cold weather suggests a warm jacket and winter accessories", () => {
  const advice = generateRecommendation({ ...weather, temperature: -5 });
  assert.match(advice, /пуховик/);
  assert.match(advice, /перчатки/);
});

test("mild weather suggests lighter layers", () => {
  const advice = generateRecommendation({ ...weather, temperature: 15 });
  assert.match(advice, /лёгкая куртка/);
  assert.doesNotMatch(advice, /пуховик/);
});

test("hot weather requires no heavy jacket", () => {
  const advice = generateRecommendation({ ...weather, temperature: 29 });
  assert.match(advice, /футболки/);
  assert.doesNotMatch(advice, /пуховик/);
});

test("rain, severe wind, high UV add safety guidance", () => {
  const advice = generateRecommendation({
    ...weather,
    condition: "Умеренный дождь",
    windSpeed: 22,
    uvIndex: 8,
  });
  assert.match(advice, /зонт/);
  assert.match(advice, /ветрозащитную/);
  assert.match(advice, /солнцезащитный крем/);
});
