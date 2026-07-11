<script setup lang="ts">
import type { HourlyForecast } from '../types/weather'
import { getWeatherIconUrl } from '../services/weatherApi'

defineProps<{
  hourly: HourlyForecast[]
}>()

function getPath(hourly: HourlyForecast[]): string {
  if (hourly.length === 0) return ''
  const cw = 100, ch = 60, pad = 10
  const temps = hourly.map((h) => h.temp)
  const min = Math.min(...temps) - 2
  const max = Math.max(...temps) + 2
  const range = max - min || 1
  const stepX = (cw - pad * 2) / (hourly.length - 1)

  return hourly
    .map((h, i) => {
      const x = pad + i * stepX
      const y = pad + ((max - h.temp) / range) * (ch - pad * 2)
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    })
    .join(' ')
}

function getDots(hourly: HourlyForecast[]): { x: number; y: number; temp: number }[] {
  if (hourly.length === 0) return []
  const cw = 100, ch = 60, pad = 10
  const temps = hourly.map((h) => h.temp)
  const min = Math.min(...temps) - 2
  const max = Math.max(...temps) + 2
  const range = max - min || 1
  const stepX = (cw - pad * 2) / (hourly.length - 1)

  return hourly.map((h, i) => ({
    x: pad + i * stepX,
    y: pad + ((max - h.temp) / range) * (ch - pad * 2),
    temp: h.temp,
  }))
}
</script>

<template>
  <div class="chart-wrap">
    <div class="chart-header">☀️ 逐小时预报</div>
    <div class="chart-area">
      <svg viewBox="0 0 100 60" class="chart-svg">
        <!-- 渐变底色 -->
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3498db" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#3498db" stop-opacity="0.02" />
          </linearGradient>
        </defs>
        <!-- 面积填充 -->
        <path
          :d="`${getPath(hourly)} L${100 - 10},${60 - 10} L${10},${60 - 10} Z`"
          fill="url(#lineGrad)"
        />
        <!-- 折线 -->
        <path
          :d="getPath(hourly)"
          fill="none"
          stroke="#3498db"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <!-- 数据点 -->
        <circle
          v-for="(dot, idx) in getDots(hourly)"
          :key="idx"
          :cx="dot.x"
          :cy="dot.y"
          r="1.8"
          fill="#fff"
          stroke="#3498db"
          stroke-width="1"
        />
      </svg>
    </div>
    <div class="hourly-labels">
      <div v-for="(h, idx) in hourly" :key="idx" class="hour-item">
        <span class="hour-time">{{ h.time }}</span>
        <img :src="getWeatherIconUrl(h.icon)" class="hour-icon" alt="" />
        <span class="hour-temp">{{ h.temp }}°</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-wrap {
  width: 100%;
  padding: 4px 0;
}

.chart-header {
  font-size: 13px;
  font-weight: 600;
  color: #5a7a9a;
  margin-bottom: 8px;
}

.chart-area {
  background: linear-gradient(180deg, rgba(52,152,219,0.04), rgba(52,152,219,0.01));
  border-radius: 12px;
  padding: 4px 8px;
  margin-bottom: 8px;
}

.chart-svg {
  width: 100%;
  height: auto;
}

.hourly-labels {
  display: flex;
  justify-content: space-between;
  gap: 2px;
}

.hour-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 0;
}

.hour-time {
  font-size: 11px;
  color: #99aabb;
}

.hour-icon {
  width: 24px;
  height: 24px;
}

.hour-temp {
  font-size: 13px;
  font-weight: 700;
  color: #2c3e50;
}
</style>
