import type { RealWeatherData } from "./weatherService";

export function generateRecommendation(weather: RealWeatherData): string {
  const parts: string[] = [];

  if (weather.temperature < 0) {
    parts.push('Надевайте тёплый пуховик, шапку, шарф и перчатки.');
  } else if (weather.temperature < 10) {
    parts.push('Подойдёт осеннее пальто или тёплая куртка со свитером.');
  } else if (weather.temperature < 20) {
    parts.push('Отличный выбор — лёгкая куртка, худи или ветровка.');
  } else {
    parts.push('Достаточно футболки, лёгкой рубашки или платья.');
  }

  if (
    weather.condition.toLowerCase().includes('дождь') ||
    weather.condition.toLowerCase().includes('морось') ||
    weather.condition.toLowerCase().includes('ливень')
  ) {
    parts.push('Возьмите с собой зонт и водонепроницаемую обувь.');
  }

  if (weather.windSpeed > 20) {
    parts.push('Сильный ветер — стоит выбрать ветрозащитную одежду.');
  }

  if (weather.uvIndex >= 6) {
    parts.push('Высокий УФ-индекс: пригодится солнцезащитный крем и очки.');
  }

  return parts.join(' ');
}
