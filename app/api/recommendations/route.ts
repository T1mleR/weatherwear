import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMockRecommendation } from '@/services/mockService';

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
  } catch (error) {
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
    const mock = getMockRecommendation(city);

    const created = await prisma.recommendation.create({
      data: {
        city: mock.city,
        temperature: mock.weather.temperature,
        feelsLike: mock.weather.feelsLike,
        condition: mock.weather.condition,
        windSpeed: mock.weather.windSpeed,
        uvIndex: mock.weather.uvIndex,
        humidity: mock.weather.humidity,
        recommendationText: mock.recommendationText,
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
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка сохранения в базу данных' },
      { status: 500 }
    );
  }
}