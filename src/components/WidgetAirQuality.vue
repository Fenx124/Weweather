<script setup lang="ts">
import { computed } from 'vue'
import type { AirPollution } from '../types/weather'
import { getAqiColor } from '../types/weather'

const props = defineProps<{
  air: AirPollution | null
  expanded?: boolean
}>()

const level = computed(() => (props.air ? { label: props.air.category, color: getAqiColor(props.air.aqi) } : null))
</script>

<template>
  <div class="widget">
    <h3 class="widget-title">🍃 空气质量</h3>
    <div v-if="air && level" class="widget-content">
      <div class="aqi-badge" :style="{ background: level.color }">{{ level.label }}</div>
      <div class="details">
        <span class="detail-item">PM2.5: {{ air.pm25 }} μg/m³</span>
        <span class="detail-item">PM10: {{ air.pm10 }} μg/m³</span>
        <span class="detail-item">O₃: {{ air.o3 }} μg/m³</span>
      </div>
      <template v-if="expanded">
        <div class="aqi-gauge">
          <div class="aqi-needle" :style="{ left: Math.min(air.aqi / 3, 95) + '%' }">▼</div>
          <div class="aqi-scale">
            <span style="color:#4caf50">优</span>
            <span style="color:#ffeb3b">良</span>
            <span style="color:#ff9800">轻度</span>
            <span style="color:#f44336">中度</span>
            <span style="color:#9c27b0">重度</span>
          </div>
        </div>
        <p class="exp-tip">💡 AQI {{ air.aqi }}，空气质量{{ level.label }}，{{ air.aqi <= 50 ? '适合外出' : air.aqi <= 100 ? '可正常活动' : '建议减少户外活动' }}</p>
      </template>
    </div>
    <p v-else class="no-data">暂无数据</p>
  </div>
</template>

<style scoped>
.widget { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; }
.widget-title { font-size: 15px; color: #5a7a9a; margin: 0 0 10px 0; font-weight: 600; transition: color 0.8s ease; }
.widget-content { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.aqi-badge { padding: 6px 24px; border-radius: 20px; font-size: 22px; font-weight: 700; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.2); }
.details { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.detail-item { font-size: 13px; color: #5a7a9a; transition: color 0.8s ease; }
.no-data { font-size: 14px; color: #99aabb; margin: 0; transition: color 0.8s ease; }
.aqi-gauge { width: 85%; margin: 12px 0 4px; position: relative; }
.aqi-needle { position: absolute; top: -2px; font-size: 12px; color: #2c3e50; transform: translateX(-50%); transition: left 0.5s ease, color 0.8s ease; }
.aqi-scale { display: flex; justify-content: space-between; font-size: 10px; font-weight: 600; margin-top: 12px; background: linear-gradient(90deg, #4caf50, #ffeb3b, #ff9800, #f44336, #9c27b0); height: 4px; border-radius: 2px; padding-top: 4px; background-clip: content-box; }
.exp-tip { font-size: 13px; color: #5a7a9a; margin-top: 8px; text-align: center; line-height: 1.5; transition: color 0.8s ease; }
</style>
