import assert from "node:assert/strict";
import test from "node:test";
import { getUvLabel, formatTime } from "../../lib/weatherDisplay.ts";

test("UV index labels match the visible dashboard thresholds", () => {
  for (const [value, expected] of [
    [0, "низкий"], [2, "низкий"], [3, "умеренный"],
    [5, "умеренный"], [6, "высокий"], [7, "высокий"],
    [8, "очень высокий"], [11, "очень высокий"],
  ]) {
    assert.equal(getUvLabel(value), expected, `UV ${value}`);
  }
});

test("stored ISO timestamps format as a short localized date/time", () => {
  const result = formatTime("2026-11-03T12:00:00.000Z");
  assert.ok(result.length >= 8);
  assert.match(result, /\d{2}:\d{2}/);
  assert.match(result.toLowerCase(), /нояб/);
});
