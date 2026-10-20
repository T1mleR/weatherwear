export type MockWeather = {
  temperature: number;
  feelsLike: number;
  condition: string;
  windSpeed: number;
  uvIndex: number;
  humidity: number;
};

export type MockRecommendation = {
  city: string;
  weather: MockWeather;
  recommendationText: string;
};

type CityPreset = {
  weather: MockWeather;
  layers: {
    base: string;
    mid: string;
    outer: string;
  };
  footwear: string;
  accessories: string;
  uvAdvice: string;
};

const CITY_PRESETS: Record<string, CityPreset> = {
  алматы: {
    weather: {
      temperature: 18,
      feelsLike: 16,
      condition: "Переменная облачность",
      windSpeed: 4,
      uvIndex: 6,
      humidity: 42,
    },
    layers: {
      base: "Хлопковая футболка или лёгкий лонгслив — день тёплый, но в тени может быть прохладно.",
      mid: "Тонкая рубашка, кардиган или лёгкий свитшот на случай ветра.",
      outer: "Лёгкая ветровка или джинсовка. Пуховик не нужен.",
    },
    footwear: "Кроссовки или лёгкие кеды с носками. Если вечером прогулка затянется — захватить закрытые лоферы.",
    accessories: "Солнцезащитные очки, лёгкий шарф-снуд на вечер, небольшая сумка. Зонт не обязателен.",
    uvAdvice:
      "УФ-индекс 6 — умеренно высокий. Днём нужны очки и SPF 30 на открытые участки кожи, особенно с 11:00 до 16:00.",
  },
  almaty: {
    weather: {
      temperature: 18,
      feelsLike: 16,
      condition: "Переменная облачность",
      windSpeed: 4,
      uvIndex: 6,
      humidity: 42,
    },
    layers: {
      base: "Хлопковая футболка или лёгкий лонгслив — день тёплый, но в тени может быть прохладно.",
      mid: "Тонкая рубашка, кардиган или лёгкий свитшот на случай ветра.",
      outer: "Лёгкая ветровка или джинсовка. Пуховик не нужен.",
    },
    footwear: "Кроссовки или лёгкие кеды с носками. Если вечером прогулка затянется — захватить закрытые лоферы.",
    accessories: "Солнцезащитные очки, лёгкий шарф-снуд на вечер, небольшая сумка. Зонт не обязателен.",
    uvAdvice:
      "УФ-индекс 6 — умеренно высокий. Днём нужны очки и SPF 30 на открытые участки кожи, особенно с 11:00 до 16:00.",
  },
  москва: {
    weather: {
      temperature: 3,
      feelsLike: -1,
      condition: "Морось и ветер",
      windSpeed: 8,
      uvIndex: 1,
      humidity: 78,
    },
    layers: {
      base: "Термобельё или плотный хлопковый лонгслив — ощущается как −1°C.",
      mid: "Флис, толстовка или тонкий свитер. Средний слой обязателен.",
      outer: "Непромокаемая утеплённая куртка или пальто с капюшоном. Защита от ветра важнее, чем «модный» тонкий тренч.",
    },
    footwear: "Непромокаемые ботинки на устойчивой подошве, тёплые носки. Кроссовки сегодня промокнут.",
    accessories: "Шапка, перчатки, шарф. Складной зонт от мороси. Тёмные очки не нужны.",
    uvAdvice: "УФ-индекс 1 — низкий. Крем от солнца не обязателен, достаточно закрытой одежды.",
  },
  moscow: {
    weather: {
      temperature: 3,
      feelsLike: -1,
      condition: "Морось и ветер",
      windSpeed: 8,
      uvIndex: 1,
      humidity: 78,
    },
    layers: {
      base: "Термобельё или плотный хлопковый лонгслив — ощущается как −1°C.",
      mid: "Флис, толстовка или тонкий свитер. Средний слой обязателен.",
      outer: "Непромокаемая утеплённая куртка или пальто с капюшоном. Защита от ветра важнее, чем «модный» тонкий тренч.",
    },
    footwear: "Непромокаемые ботинки на устойчивой подошве, тёплые носки. Кроссовки сегодня промокнут.",
    accessories: "Шапка, перчатки, шарф. Складной зонт от мороси. Тёмные очки не нужны.",
    uvAdvice: "УФ-индекс 1 — низкий. Крем от солнца не обязателен, достаточно закрытой одежды.",
  },
  дубай: {
    weather: {
      temperature: 34,
      feelsLike: 37,
      condition: "Ясно, жарко",
      windSpeed: 3,
      uvIndex: 11,
      humidity: 55,
    },
    layers: {
      base: "Самая лёгкая дышащая футболка или рубашка изо льна. Синтетика без вентиляции будет парить.",
      mid: "Средний слой не нужен. Возьмите тонкую рубашку с длинным рукавом только для кондиционера в помещении.",
      outer: "Верхняя одежда не нужна. Максимум — ультралёгкая накидка от солнца.",
    },
    footwear: "Открытые, но удобные сандалии или дышащие кроссовки. Избегайте плотной кожи.",
    accessories: "Широкополая шляпа или кепка, солнцезащитные очки, бутылка воды. Зонт — как тент от солнца, не от дождя.",
    uvAdvice:
      "УФ-индекс 11 — экстремальный. SPF 50, очки с UV400, головной убор. Старайтесь быть в тени с 11:00 до 16:00.",
  },
  dubai: {
    weather: {
      temperature: 34,
      feelsLike: 37,
      condition: "Ясно, жарко",
      windSpeed: 3,
      uvIndex: 11,
      humidity: 55,
    },
    layers: {
      base: "Самая лёгкая дышащая футболка или рубашка изо льна. Синтетика без вентиляции будет парить.",
      mid: "Средний слой не нужен. Возьмите тонкую рубашку с длинным рукавом только для кондиционера в помещении.",
      outer: "Верхняя одежда не нужна. Максимум — ультралёгкая накидка от солнца.",
    },
    footwear: "Открытые, но удобные сандалии или дышащие кроссовки. Избегайте плотной кожи.",
    accessories: "Широкополая шляпа или кепка, солнцезащитные очки, бутылка воды. Зонт — как тент от солнца, не от дождя.",
    uvAdvice:
      "УФ-индекс 11 — экстремальный. SPF 50, очки с UV400, головной убор. Старайтесь быть в тени с 11:00 до 16:00.",
  },
};

const DEFAULT_PRESET: CityPreset = {
  weather: {
    temperature: 12,
    feelsLike: 10,
    condition: "Облачно, возможен краткий дождь",
    windSpeed: 5,
    uvIndex: 3,
    humidity: 64,
  },
  layers: {
    base: "Лонгслив или футболка под слой — база должна быть комфортной в помещении.",
    mid: "Лёгкий свитер, худи или рубашка. Без среднего слоя вечером будет зябко.",
    outer: "Ветровка или тренч с капюшоном: +12°C и влажность намекают на короткий дождь.",
  },
  footwear: "Закрытые кроссовки или челси. Запасных носков не помешает, если лужи глубокие.",
  accessories: "Компактный зонт, лёгкий шарф. Солнцезащитные очки — по желанию.",
  uvAdvice: "УФ-индекс 3 — умеренный. Короткое пребывание на солнце безопасно, SPF 15 полезен, если будете гулять долго.",
};

function buildRecommendationText(city: string, preset: CityPreset): string {
  const { weather, layers, footwear, accessories, uvAdvice } = preset;

  return [
    `Совет стилиста для города ${city}`,
    ``,
    `Сейчас ${weather.temperature}°C (ощущается как ${weather.feelsLike}°C), ${weather.condition.toLowerCase()}. Ветер ${weather.windSpeed} м/с, влажность ${weather.humidity}%.`,
    ``,
    `Слои одежды`,
    `• Базовый слой: ${layers.base}`,
    `• Средний слой: ${layers.mid}`,
    `• Верхний слой: ${layers.outer}`,
    ``,
    `УФ-индекс: ${weather.uvIndex}`,
    uvAdvice,
    ``,
    `Обувь`,
    footwear,
    ``,
    `Аксессуары`,
    accessories,
    ``,
    `Короткий вывод: одевайтесь слоями, чтобы можно было снять или добавить вещь в течение дня. Ориентируйтесь на ощущаемую температуру, а не только на цифру на термометре.`,
  ].join("\n");
}

export function getMockRecommendation(city: string): MockRecommendation {
  const trimmed = city.trim();
  const displayCity = trimmed.length > 0 ? trimmed : "Неизвестный город";
  const key = trimmed.toLowerCase();
  const preset = CITY_PRESETS[key] ?? DEFAULT_PRESET;

  return {
    city: displayCity,
    weather: preset.weather,
    recommendationText: buildRecommendationText(displayCity, preset),
  };
}
