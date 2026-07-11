import type { CurrentWeather, AirPollution, Forecast, HourlyForecast, DailyForecast } from '../types/weather'
import { CITIES } from '../data/cities'

const API_KEY = import.meta.env.VITE_OWM_API_KEY
const BASE = 'https://api.openweathermap.org'

/** 中文城市名 → 英文名（OWM 不支持中文搜索） */
function toEn(city: string): string {
  const found = CITIES.find(c => c.name === city)
  return found ? found.nameEn : city
}

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
  const en = toEn(city)
  const url = `${BASE}/data/2.5/weather?q=${encodeURIComponent(en)}&appid=${API_KEY}&units=metric&lang=zh_cn`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`城市查找失败 (${res.status})`)
  const d = await res.json()
  return {
    cityName: city,
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

/** 获取天气预报（小时 + 每日） */
export async function fetchForecast(city: string): Promise<Forecast> {
  const en = toEn(city)
  const url = `${BASE}/data/2.5/forecast?q=${encodeURIComponent(en)}&appid=${API_KEY}&units=metric&lang=zh_cn`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`预报获取失败 (${res.status})`)
  const data = await res.json()

  // 逐小时（前 8 个点 = 24h，取 3h 间隔）
  const hourly: HourlyForecast[] = data.list.slice(0, 8).map((item: any) => ({
    time: new Date(item.dt * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    temp: Math.round(item.main.temp),
    icon: item.weather[0].icon,
  }))

  // 按天聚合
  const dayMap: Record<string, { highs: number[]; lows: number[]; icons: string[]; descs: string[] }> = {}
  data.list.forEach((item: any) => {
    const day = new Date(item.dt * 1000).toLocaleDateString('zh-CN', { weekday: 'short' })
    if (!dayMap[day]) dayMap[day] = { highs: [], lows: [], icons: [], descs: [] }
    dayMap[day].highs.push(item.main.temp_max)
    dayMap[day].lows.push(item.main.temp_min)
    dayMap[day].icons.push(item.weather[0].icon)
    dayMap[day].descs.push(item.weather[0].description)
  })

  const daily: DailyForecast[] = Object.entries(dayMap).slice(0, 7).map(([day, v]) => ({
    day,
    icon: v.icons[Math.floor(v.icons.length / 2)] || '01d',
    tempHigh: Math.round(Math.max(...v.highs)),
    tempLow: Math.round(Math.min(...v.lows)),
    desc: v.descs[Math.floor(v.descs.length / 2)] || '',
  }))

  return { hourly, daily }
}

/* ==================== 模拟数据（API 不可用时自动回退） ==================== */

const MOCK_WEATHER: CurrentWeather = {
  cityName: '昆明',
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

const MOCK_FORECAST: Forecast = {
  hourly: [
    { time: '12:00', temp: 32, icon: '01d' },
    { time: '15:00', temp: 33, icon: '02d' },
    { time: '18:00', temp: 30, icon: '02d' },
    { time: '21:00', temp: 27, icon: '03n' },
    { time: '00:00', temp: 25, icon: '04n' },
    { time: '03:00', temp: 23, icon: '04n' },
    { time: '06:00', temp: 24, icon: '02d' },
    { time: '09:00', temp: 29, icon: '01d' },
  ],
  daily: [
    { day: '周五', icon: '02d', tempHigh: 33, tempLow: 25, desc: '多云' },
    { day: '周六', icon: '10d', tempHigh: 30, tempLow: 24, desc: '小雨' },
    { day: '周日', icon: '01d', tempHigh: 34, tempLow: 26, desc: '晴' },
    { day: '周一', icon: '03d', tempHigh: 32, tempLow: 25, desc: '阴' },
    { day: '周二', icon: '02d', tempHigh: 31, tempLow: 24, desc: '多云' },
    { day: '周三', icon: '10d', tempHigh: 28, tempLow: 23, desc: '小雨' },
    { day: '周四', icon: '01d', tempHigh: 33, tempLow: 26, desc: '晴' },
  ],
}

/** 带模拟回退的预报查询 */
export async function fetchForecastSafe(city: string): Promise<Forecast> {
  try {
    return await fetchForecast(city)
  } catch {
    return { ...MOCK_FORECAST }
  }
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
      air = { aqi: 50, category: '--', pm25: 0, pm10: 0, o3: 0 }
    }
    return { weather, air }
  } catch {
    return {
      weather: { ...MOCK_WEATHER, cityName: city || MOCK_WEATHER.cityName },
      air: { ...MOCK_AIR },
    }
  }
}
