import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Readiness probe: checks that both the API server and database are reachable.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json(
      { status: "unavailable" },
      { status: 503 }
    );
  }
}
