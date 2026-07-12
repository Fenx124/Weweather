<script setup lang="ts">
import type { Forecast } from '../types/weather'
import { getWeatherIconUrl } from '../services/weatherApi'

defineProps<{
  forecast: Forecast | null
  loading: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

function getPath(hourly: { temp: number }[]): string {
  if (hourly.length === 0) return ''
  const cw = 100, ch = 50, pad = 8
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

function cyFor(hourly: { temp: number }[], i: number): number {
  const ch = 50, pad = 8
  const temps = hourly.map((h) => h.temp)
  const min = Math.min(...temps) - 2
  const max = Math.max(...temps) + 2
  const range = max - min || 1
  const item = hourly[i]
  if (!item) return pad
  return pad + ((max - item.temp) / range) * (ch - pad * 2)
}
</script>

<template>
  <div class="forecast-right" @click.stop>
    <button class="panel-close" @click="emit('close')">✕</button>

    <div v-if="loading" class="panel-loading">
      <div class="spinner-sm"></div>
      <p>加载预报...</p>
    </div>

    <template v-else-if="forecast">
      <div class="section">
        <div class="section-title">📈 12小时预报</div>
        <div class="chart-area">
          <svg viewBox="0 0 100 50" class="chart-svg">
            <defs>
              <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#3498db" stop-opacity="0.3" />
                <stop offset="100%" stop-color="#3498db" stop-opacity="0.02" />
              </linearGradient>
            </defs>
            <path
              :d="`${getPath(forecast.hourly)} L92,42 L8,42 Z`"
              fill="url(#hrGrad)"
            />
            <path
              :d="getPath(forecast.hourly)"
              fill="none"
              stroke="#3498db"
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <circle
              v-for="(_, i) in forecast.hourly"
              :key="i"
              :cx="8 + i * (84 / (forecast.hourly.length - 1))"
              :cy="cyFor(forecast.hourly, i)"
              r="1.5"
              fill="#fff"
              stroke="#3498db"
              stroke-width="1"
            />
          </svg>
        </div>
        <div class="hourly-row">
          <div v-for="(h, i) in forecast.hourly" :key="i" class="hour-cell">
            <span class="h-time">{{ h.time }}</span>
            <img :src="getWeatherIconUrl(h.icon)" class="h-icon" alt="" />
            <span class="h-temp">{{ h.temp }}°</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📅 七日预报</div>
        <div class="daily-list">
          <div v-for="(d, i) in forecast.daily" :key="i" class="daily-row">
            <span class="d-day">{{ d.day }}</span>
            <img :src="getWeatherIconUrl(d.icon)" class="d-icon" alt="" />
            <span class="d-desc">{{ d.desc }}</span>
            <div class="d-temps">
              <span class="t-high">{{ d.tempHigh }}°</span>
              <span class="t-bar">
                <span
                  class="t-fill"
                  :style="{
                    width: `${Math.max(((d.tempHigh - d.tempLow) / 15) * 100, 15)}%`,
                    left: `${Math.max(((d.tempLow - 20) / 15) * 100, 0)}%`,
                  }"
                ></span>
              </span>
              <span class="t-low">{{ d.tempLow }}°</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.forecast-right {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 16px 12px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(52, 152, 219, 0.15);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  animation: slideIn 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
  height: 100%;
  overflow-y: auto;
}

@keyframes slideIn {
  from { transform: translateX(40px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.panel-close {
  position: absolute;
  top: 8px;
  right: 12px;
  border: none;
  background: rgba(0,0,0,0.05);
  color: #999;
  font-size: 14px;
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition: all 0.2s;
}
.panel-close:hover { background: rgba(0,0,0,0.1); color: #333; }

.panel-loading { text-align: center; padding: 30px; color: #99aabb; font-size: 14px; }

.spinner-sm {
  width: 24px; height: 24px; margin: 0 auto 8px;
  border: 3px solid rgba(52,152,219,0.2); border-top-color: #3498db;
  border-radius: 50%; animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.section { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.section-title { font-size: 12px; font-weight: 700; color: #3498db; margin-bottom: 6px; }

.chart-area {
  background: linear-gradient(180deg, rgba(52,152,219,0.05), transparent);
  border-radius: 10px; padding: 2px 4px; margin-bottom: 2px;
}
.chart-svg { width: 100%; height: auto; }

.hourly-row { display: flex; justify-content: space-between; gap: 1px; }
.hour-cell { display: flex; flex-direction: column; align-items: center; gap: 0; min-width: 0; }
.h-time { font-size: 10px; color: #99aabb; }
.h-icon { width: 20px; height: 20px; }
.h-temp { font-size: 11px; font-weight: 700; color: #2c3e50; }

.daily-list { display: flex; flex-direction: column; gap: 1px; flex: 1; }
.daily-row {
  display: flex; align-items: center; gap: 5px;
  padding: 3px 6px; border-radius: 8px; transition: background 0.15s;
}
.daily-row:hover { background: rgba(52,152,219,0.06); }
.d-day { font-size: 11px; font-weight: 600; color: #2c3e50; width: 28px; }
.d-icon { width: 22px; height: 22px; }
.d-desc { font-size: 11px; color: #5a7a9a; width: 32px; }
.d-temps { flex: 1; display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; }
.t-high { color: #e74c3c; }
.t-low { color: #3498db; }

.t-bar { flex: 1; height: 3px; background: #eef2f7; border-radius: 2px; position: relative; }
.t-fill {
  position: absolute; top: 0; height: 100%;
  background: linear-gradient(90deg, #3498db, #e74c3c); border-radius: 2px;
}
</style>
