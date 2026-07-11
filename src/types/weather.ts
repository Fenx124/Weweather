/** 实时天气数据 */
export interface CurrentWeather {
  cityName: string
  temp: number
  feelsLike: number
  humidity: number
  windSpeed: number
  description: string
  /** OpenWeatherMap 图标代码，如 "02d" */
  icon: string
  /** 日出时间 HH:mm */
  sunrise: string
  /** 日落时间 HH:mm */
  sunset: string
  lat: number
  lon: number
}

/** 空气质量数据 */
export interface AirPollution {
  /** 估算 AQI 数值 */
  aqi: number
  category: string
  pm25: number
  pm10: number
  o3: number
}

/** AQI 颜色映射 */
export function getAqiColor(aqi: number): string {
  if (aqi <= 50) return '#4caf50'
  if (aqi <= 100) return '#ffeb3b'
  if (aqi <= 150) return '#ff9800'
  if (aqi <= 200) return '#f44336'
  if (aqi <= 300) return '#9c27b0'
  return '#800000'
}
