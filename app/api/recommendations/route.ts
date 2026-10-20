import { connection } from "next/server";
import {
  getMockRecommendation,
  type MockRecommendation,
} from "@/services/mockService";

export type StoredRecommendation = MockRecommendation & {
  id: string;
  createdAt: string;
};

const recommendations: StoredRecommendation[] = [];

export async function GET() {
  await connection();
  return Response.json(recommendations);
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const city =
    typeof body === "object" &&
    body !== null &&
    "city" in body &&
    typeof body.city === "string"
      ? body.city.trim()
      : "";

  if (!city) {
    return Response.json({ error: "City is required" }, { status: 400 });
  }

  const mock = getMockRecommendation(city);
  const created: StoredRecommendation = {
    ...mock,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  recommendations.unshift(created);

  return Response.json(created, { status: 201 });
}
