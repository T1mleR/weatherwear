// Run inside the migrator container after "prisma migrate deploy" succeeds.
// This is append-only: existing IDs are skipped, no rows are deleted.
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const file = process.argv[2] || "/backup/recommendations.json";
const prisma = new PrismaClient();

try {
  const items = JSON.parse(await readFile(file, "utf8"));
  if (!Array.isArray(items)) throw new Error("Export must be a JSON array");
  const data = items.map((item) => ({
    id: String(item.id),
    city: String(item.city),
    temperature: Number(item.temperature),
    feelsLike: Number(item.feelsLike),
    condition: String(item.condition),
    windSpeed: Number(item.windSpeed),
    uvIndex: Number(item.uvIndex),
    humidity: Number(item.humidity),
    recommendationText: String(item.recommendationText),
    createdAt: new Date(item.createdAt),
  }));

  if (data.some((row) =>
    !row.id || row.createdAt.toString() === "Invalid Date" ||
    [row.temperature, row.feelsLike, row.windSpeed, row.uvIndex, row.humidity]
      .some((value) => !Number.isFinite(value))
  )) {
    throw new Error("Export contains invalid records");
  }

  const result = await prisma.recommendation.createMany({
    data,
    skipDuplicates: true,
  });
  const count = await prisma.recommendation.count();
  console.log(`Imported ${result.count} new rows; PostgreSQL now has ${count} rows.`);
} catch (error) {
  console.error("Import failed:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
