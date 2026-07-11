<script setup lang="ts">
import type { DailyForecast } from '../types/weather'
import { getWeatherIconUrl } from '../services/weatherApi'

defineProps<{
  daily: DailyForecast[]
}>()
</script>

<template>
  <div class="daily-wrap">
    <div class="daily-header">📅 七日预报</div>
    <div class="daily-list">
      <div v-for="(d, idx) in daily" :key="idx" class="daily-item">
        <span class="daily-day">{{ d.day }}</span>
        <img :src="getWeatherIconUrl(d.icon)" class="daily-icon" alt="" />
        <span class="daily-desc">{{ d.desc }}</span>
        <div class="daily-temps">
          <span class="temp-high">{{ d.tempHigh }}°</span>
          <span class="temp-low">{{ d.tempLow }}°</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.daily-wrap {
  width: 100%;
  padding: 4px 0;
}

.daily-header {
  font-size: 13px;
  font-weight: 600;
  color: #5a7a9a;
  margin-bottom: 6px;
}

.daily-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.daily-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 10px;
  transition: background 0.2s;
}

.daily-item:hover {
  background: rgba(52, 152, 219, 0.06);
}

.daily-day {
  font-size: 13px;
  font-weight: 600;
  color: #2c3e50;
  width: 36px;
}

.daily-icon {
  width: 28px;
  height: 28px;
}

.daily-desc {
  flex: 1;
  font-size: 12px;
  color: #5a7a9a;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.daily-temps {
  display: flex;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.temp-high {
  color: #e74c3c;
}

.temp-low {
  color: #3498db;
}
</style>
