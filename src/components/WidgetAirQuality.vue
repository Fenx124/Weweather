<script setup lang="ts">
import { computed } from 'vue'
import type { AirPollution } from '../types/weather'
import { getAqiColor } from '../types/weather'

const props = defineProps<{
  air: AirPollution | null
}>()

const level = computed(() => (props.air ? { label: props.air.category, color: getAqiColor(props.air.aqi) } : null))
</script>

<template>
  <div class="widget">
    <h3 class="widget-title">🍃 空气质量</h3>
    <div v-if="air && level" class="widget-content">
      <div class="aqi-badge" :style="{ background: level.color }">
        {{ level.label }}
      </div>
      <div class="details">
        <span class="detail-item">PM2.5: {{ air.pm25 }} μg/m³</span>
        <span class="detail-item">PM10: {{ air.pm10 }} μg/m³</span>
        <span class="detail-item">O₃: {{ air.o3 }} μg/m³</span>
      </div>
    </div>
    <p v-else class="no-data">暂无数据</p>
  </div>
</template>

<style scoped>
.widget {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.widget-title {
  font-size: 14px;
  color: #5a7a9a;
  margin: 0 0 12px 0;
  font-weight: 500;
}

.widget-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.aqi-badge {
  padding: 6px 20px;
  border-radius: 20px;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.detail-item {
  font-size: 12px;
  color: #5a7a9a;
}

.no-data {
  font-size: 14px;
  color: #99aabb;
  margin: 0;
}
</style>
