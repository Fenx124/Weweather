import type { CurrentWeather, AirPollution } from '../types/weather'

const API_KEY = import.meta.env.VITE_OWM_API_KEY
const BASE = 'https://api.openweathermap.org'

/** 格式化 Unix 时间戳 → HH:mm */
function fmtTime(ts: number): string {
  const d = new Date(ts * 1000)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

/** OWM AQI (1-5) → 估算 AQI 数值 + 中文标签 */
function mapAqi(owm: number): { aqi: number; category: string } {
  const map: Record<number, { aqi: number; category: string }> = {
    1: { aqi: 25, category: '优' },
    2: { aqi: 75, category: '良' },
    3: { aqi: 125, category: '轻度污染' },
    4: { aqi: 175, category: '中度污染' },
    5: { aqi: 300, category: '重度污染' },
  }
  return map[owm] || { aqi: 0, category: '未知' }
}

/** 获取实时天气 */
export async function fetchCurrentWeather(city: string): Promise<CurrentWeather> {
  const url = `${BASE}/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=zh_cn`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`城市查找失败 (${res.status})`)
  const d = await res.json()
  return {
    cityName: d.name,
    temp: Math.round(d.main.temp),
    feelsLike: Math.round(d.main.feels_like),
    humidity: d.main.humidity,
    windSpeed: d.wind.speed,
    description: d.weather[0].description,
    icon: d.weather[0].icon,
    sunrise: fmtTime(d.sys.sunrise),
    sunset: fmtTime(d.sys.sunset),
    lat: d.coord.lat,
    lon: d.coord.lon,
  }
}

/** 获取空气质量 */
export async function fetchAirPollution(lat: number, lon: number): Promise<AirPollution> {
  const url = `${BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`空气质量获取失败 (${res.status})`)
  const item = (await res.json()).list[0]
  const mapped = mapAqi(item.main.aqi)
  return {
    aqi: mapped.aqi,
    category: mapped.category,
    pm25: item.components.pm2_5,
    pm10: item.components.pm10,
    o3: item.components.o3,
  }
}

/** 天气图标 URL */
export function getWeatherIconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`
}

/* ==================== 模拟数据（API 不可用时自动回退） ==================== */

const MOCK_WEATHER: CurrentWeather = {
  cityName: '重庆',
  temp: 32,
  feelsLike: 35,
  humidity: 72,
  windSpeed: 3.5,
  description: '多云',
  icon: '02d',
  sunrise: '05:15',
  sunset: '18:52',
  lat: 31.23,
  lon: 121.47,
}

const MOCK_AIR: AirPollution = {
  aqi: 68,
  category: '良',
  pm25: 35.6,
  pm10: 58.2,
  o3: 92.0,
}

/** 统一入口：天气 + 空气质量（带模拟回退） */
export async function fetchWeather(city: string): Promise<{
  weather: CurrentWeather
  air: AirPollution
}> {
  try {
    const weather = await fetchCurrentWeather(city)
    let air: AirPollution
    try {
      air = await fetchAirPollution(weather.lat, weather.lon)
    } catch {
      air = { ...MOCK_AIR, aqi: 50, category: '--' }
    }
    return { weather, air }
  } catch {
    return {
      weather: { ...MOCK_WEATHER, cityName: city || MOCK_WEATHER.cityName },
      air: { ...MOCK_AIR },
    }
  }
}
