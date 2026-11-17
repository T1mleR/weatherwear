import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";

test("API readiness checks database connection", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, "ok");
});

test("POST rejects missing city and invalid JSON", async () => {
  const missing = await fetch(`${baseUrl}/api/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ city: "   " }),
  });
  assert.equal(missing.status, 400);
  assert.equal((await missing.json()).error, "City is required");

  const malformed = await fetch(`${baseUrl}/api/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{broken-json",
  });
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).error, "Invalid JSON");
});

test("GET history returns a persisted PostgreSQL recommendation", async () => {
  const prisma = new PrismaClient();
  const id = randomUUID();
  try {
    await prisma.recommendation.create({
      data: {
        id,
        city: "CI-Test-City",
        temperature: 13,
        feelsLike: 11,
        condition: "Ясно",
        windSpeed: 2,
        uvIndex: 3,
        humidity: 41,
        recommendationText: "Тестовая рекомендация",
      },
    });

    const response = await fetch(`${baseUrl}/api/recommendations`, {
      headers: { "Cache-Control": "no-cache" },
    });
    assert.equal(response.status, 200);
    const rows = await response.json();
    assert.ok(Array.isArray(rows));
    const item = rows.find((row) => row.id === id);
    assert.ok(item, "Expected record is present in GET history");
    assert.equal(item.city, "CI-Test-City");
    assert.equal(item.weather.temperature, 13);
    assert.equal(item.recommendationText, "Тестовая рекомендация");
    assert.ok(item.createdAt);
  } finally {
    await prisma.recommendation.deleteMany({ where: { id } });
    await prisma.$disconnect();
  }
});
