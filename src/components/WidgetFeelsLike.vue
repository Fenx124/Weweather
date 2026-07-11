<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  feelsLike: number
  temp: number
  expanded?: boolean
}>()

const diff = computed(() => {
  const d = props.feelsLike - props.temp
  if (d > 2) return '体感较热'
  if (d > 0) return '体感略暖'
  if (d < -2) return '体感较凉'
  if (d < 0) return '体感略凉'
  return '体感适中'
})

const comfort = computed(() => {
  const f = props.feelsLike
  if (f < 0) return '寒冷'
  if (f < 10) return '偏冷'
  if (f < 20) return '凉爽'
  if (f < 26) return '舒适'
  if (f < 32) return '偏热'
  if (f < 38) return '炎热'
  return '酷热'
})
</script>

<template>
  <div class="widget">
    <h3 class="widget-title">🌡️ 体感温度</h3>
    <div class="widget-content">
      <div class="feels-temp">
        <span class="feels-value">{{ feelsLike }}</span>
        <span class="feels-unit">°C</span>
      </div>
      <span class="feels-desc">{{ diff }}</span>
    </div>
    <template v-if="expanded">
      <div class="exp-cmp">
        <span>实际温度 <b>{{ temp }}°C</b></span>
        <span>体感温度 <b>{{ feelsLike }}°C</b></span>
        <span>差值 <b>{{ feelsLike > temp ? '+' : '' }}{{ feelsLike - temp }}°C</b></span>
      </div>
      <div class="exp-bar-wrap">
        <span class="exp-bar-label">舒适度</span>
        <div class="exp-bar">
          <div class="exp-bar-fill" :style="{ width: Math.min(Math.max((feelsLike / 40) * 100, 5), 100) + '%' }"></div>
        </div>
        <span class="exp-bar-val">{{ comfort }}</span>
      </div>
      <p class="exp-tip">💡 {{ diff }}，{{ comfort }}天气，{{ feelsLike > 30 ? '注意防暑降温' : feelsLike < 10 ? '注意保暖' : '体感舒适' }}</p>
    </template>
  </div>
</template>

<style scoped>
.widget { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; }
.widget-title { font-size: 15px; color: #5a7a9a; margin: 0 0 10px 0; font-weight: 600; }
.widget-content { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.feels-temp { display: flex; align-items: flex-start; }
.feels-value { font-size: 48px; font-weight: 300; color: #2c3e50; line-height: 1; }
.feels-unit { font-size: 22px; color: #5a7a9a; margin-top: 6px; }
.feels-desc { font-size: 14px; color: #5a7a9a; background: rgba(74,144,217,0.1); padding: 5px 16px; border-radius: 14px; }
.exp-cmp { display: flex; flex-direction: column; gap: 4px; margin: 14px 0 10px; font-size: 13px; color: #5a7a9a; }
.exp-cmp b { color: #2c3e50; }
.exp-bar-wrap { display: flex; align-items: center; gap: 10px; width: 75%; margin-bottom: 10px; }
.exp-bar-label { font-size: 12px; color: #5a7a9a; width: 42px; flex-shrink: 0; }
.exp-bar { flex: 1; height: 10px; background: #eef2f7; border-radius: 5px; overflow: hidden; }
.exp-bar-fill { height: 100%; border-radius: 5px; background: linear-gradient(90deg, #3498db, #f39c12, #e74c3c); transition: width 0.6s ease; }
.exp-bar-val { font-size: 13px; font-weight: 600; color: #2c3e50; width: 36px; flex-shrink: 0; }
.exp-tip { font-size: 13px; color: #5a7a9a; margin-top: 8px; text-align: center; line-height: 1.5; }
</style>
