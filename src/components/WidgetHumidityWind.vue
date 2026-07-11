<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  humidity: number
  windSpeed: number
  expanded?: boolean
}>()

const humidityLevel = computed(() => {
  if (props.humidity < 30) return '干燥'
  if (props.humidity < 60) return '舒适'
  if (props.humidity < 80) return '微潮'
  return '潮湿'
})

const windLevel = computed(() => {
  if (props.windSpeed < 1) return '无风'
  if (props.windSpeed < 5) return '微风'
  if (props.windSpeed < 10) return '和风'
  if (props.windSpeed < 17) return '强风'
  return '大风'
})
</script>

<template>
  <div class="widget">
    <h3 class="widget-title">💧 湿度 / 风速</h3>
    <div class="widget-content" :class="{ expanded }">
      <div class="metric">
        <span class="metric-value">{{ humidity }}</span>
        <span class="metric-unit">%</span>
        <span class="metric-label">湿度</span>
        <span v-if="expanded" class="metric-tag">{{ humidityLevel }}</span>
      </div>
      <div class="divider"></div>
      <div class="metric">
        <span class="metric-value">{{ windSpeed }}</span>
        <span class="metric-unit">m/s</span>
        <span class="metric-label">风速</span>
        <span v-if="expanded" class="metric-tag">{{ windLevel }}</span>
      </div>
    </div>
    <template v-if="expanded">
      <div class="exp-bar-wrap">
        <span class="exp-bar-label">湿度</span>
        <div class="exp-bar"><div class="exp-bar-fill humidity-fill" :style="{ width: humidity + '%' }"></div></div>
        <span class="exp-bar-val">{{ humidity }}%</span>
      </div>
      <div class="exp-bar-wrap">
        <span class="exp-bar-label">风速</span>
        <div class="exp-bar"><div class="exp-bar-fill wind-fill" :style="{ width: Math.min(windSpeed * 8, 100) + '%' }"></div></div>
        <span class="exp-bar-val">{{ windSpeed }} m/s</span>
      </div>
      <p class="exp-tip">💡 {{ humidityLevel }}天气，{{ windLevel }}，{{ humidity > 70 ? '注意防潮' : humidity < 30 ? '注意补水' : '体感舒适' }}</p>
    </template>
  </div>
</template>

<style scoped>
.widget { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; }
.widget-title { font-size: 15px; color: #5a7a9a; margin: 0 0 10px 0; font-weight: 600; }
.widget-content { display: flex; align-items: center; gap: 20px; }
.widget-content.expanded { margin-bottom: 16px; }
.metric { display: flex; flex-direction: column; align-items: center; }
.metric-value { font-size: 36px; font-weight: 700; color: #2c3e50; line-height: 1.1; }
.metric-unit { font-size: 14px; color: #5a7a9a; margin-bottom: 1px; }
.metric-label { font-size: 13px; color: #99aabb; }
.metric-tag { font-size: 12px; color: #3498db; margin-top: 3px; font-weight: 600; }
.divider { width: 1px; height: 50px; background: rgba(0,0,0,0.08); }
.exp-bar-wrap { display: flex; align-items: center; gap: 10px; width: 75%; margin-bottom: 10px; }
.exp-bar-label { font-size: 12px; color: #5a7a9a; width: 30px; flex-shrink: 0; }
.exp-bar { flex: 1; height: 10px; background: #eef2f7; border-radius: 5px; overflow: hidden; }
.exp-bar-fill { height: 100%; border-radius: 5px; transition: width 0.6s ease; }
.humidity-fill { background: linear-gradient(90deg, #3498db, #2ecc71); }
.wind-fill { background: linear-gradient(90deg, #74b9ff, #a29bfe); }
.exp-bar-val { font-size: 13px; font-weight: 600; color: #2c3e50; width: 50px; text-align: right; flex-shrink: 0; }
.exp-tip { font-size: 13px; color: #5a7a9a; margin-top: 10px; text-align: center; line-height: 1.5; }
</style>
