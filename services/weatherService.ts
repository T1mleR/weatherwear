export interface RealWeatherData {
    city: string;
    temperature: number;
    feelsLike: number;
    condition: string;
    windSpeed: number;
    uvIndex: number;
    humidity: number;
  }
  
  export async function getRealWeather(city: string): Promise<RealWeatherData> {
    // 1. Поиск координат города (Геокодинг API)
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();
  
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error(`Город "${city}" не найден`);
    }
  
    const { latitude, longitude, name } = geoData.results[0];
  
    // 2. Получение реальной погоды по координатам
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();
  
    const current = weatherData.current;
  
    // Расшифровка кодов погоды WMO
    const weatherCodes: Record<number, string> = {
      0: 'Ясно',
      1: 'Преимущественно ясно',
      2: 'Переменная облачность',
      3: 'Пасмурно',
      45: 'Туман',
      51: 'Лёгкая морось',
      61: 'Небольшой дождь',
      63: 'Умеренный дождь',
      65: 'Сильный дождь',
      71: 'Небольшой снег',
      73: 'Снегопад',
      80: 'Ливень',
      95: 'Гроза',
    };
  
    const condition = weatherCodes[current.weather_code] || 'Ясно';
  
    return {
      city: name,
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      condition,
      windSpeed: Math.round(current.wind_speed_10m),
      uvIndex: Math.round(current.uv_index || 0),
      humidity: Math.round(current.relative_humidity_2m),
    };
  }