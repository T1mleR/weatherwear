import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRealWeather } from '@/services/weatherService';
import { generateRecommendation } from '@/services/recommendationService';

export async function GET() {
  try {
    const history = await prisma.recommendation.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const formattedHistory = history.map((item) => ({
      id: item.id,
      city: item.city,
      createdAt: item.createdAt.toISOString(),
      weather: {
        temperature: item.temperature,
        feelsLike: item.feelsLike,
        condition: item.condition,
        windSpeed: item.windSpeed,
        uvIndex: item.uvIndex,
        humidity: item.humidity,
      },
      recommendationText: item.recommendationText,
    }));

    return NextResponse.json(formattedHistory);
  } catch {
    return NextResponse.json(
      { error: 'Ошибка загрузки истории из базы данных' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const city =
    typeof body === 'object' &&
    body !== null &&
    'city' in body &&
    typeof body.city === 'string'
      ? body.city.trim()
      : '';

  if (!city) {
    return NextResponse.json({ error: 'City is required' }, { status: 400 });
  }

  try {
    const weather = await getRealWeather(city);
    const recommendationText = generateRecommendation(weather);

    const created = await prisma.recommendation.create({
      data: {
        city: weather.city,
        temperature: weather.temperature,
        feelsLike: weather.feelsLike,
        condition: weather.condition,
        windSpeed: weather.windSpeed,
        uvIndex: weather.uvIndex,
        humidity: weather.humidity,
        recommendationText,
      },
    });

    const responsePayload = {
      id: created.id,
      city: created.city,
      createdAt: created.createdAt.toISOString(),
      weather: {
        temperature: created.temperature,
        feelsLike: created.feelsLike,
        condition: created.condition,
        windSpeed: created.windSpeed,
        uvIndex: created.uvIndex,
        humidity: created.humidity,
      },
      recommendationText: created.recommendationText,
    };

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Ошибка получения погоды';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}