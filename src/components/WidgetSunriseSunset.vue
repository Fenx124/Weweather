<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  sunrise: string
  sunset: string
  expanded?: boolean
}>()

const now = ref(new Date())

let timer: ReturnType<typeof setInterval>
onMounted(() => { timer = setInterval(() => now.value = new Date(), 60000) })
onUnmounted(() => clearInterval(timer))

const dayLength = computed(() => {
  const [sh = 0, sm = 0] = props.sunrise.split(':').map(Number)
  const [eh = 0, em = 0] = props.sunset.split(':').map(Number)
  const totalMin = (eh * 60 + em) - (sh * 60 + sm)
  return `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`
})

/** 当前时间在日出-日落间的进度 0~100 */
const progress = computed(() => {
  const [sh = 0, sm = 0] = props.sunrise.split(':').map(Number)
  const [eh = 0, em = 0] = props.sunset.split(':').map(Number)
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em
  const currentMin = now.value.getHours() * 60 + now.value.getMinutes()
  if (currentMin <= startMin) return 0
  if (currentMin >= endMin) return 100
  return Math.round(((currentMin - startMin) / (endMin - startMin)) * 100)
})

const progressLabel = computed(() => {
  if (progress.value === 0) return '日出前'
  if (progress.value === 100) return '日落后'
  return `白天已过 ${progress.value}%`
})
</script>

<template>
  <div class="widget">
    <h3 class="widget-title">🌅 日出 / 日落</h3>
    <div class="widget-content">
      <div class="metric">
        <span class="icon">🌄</span>
        <span class="metric-value">{{ sunrise }}</span>
        <span class="metric-label">日出</span>
      </div>
      <div class="divider"></div>
      <div class="metric">
        <span class="icon">🌇</span>
        <span class="metric-value">{{ sunset }}</span>
        <span class="metric-label">日落</span>
      </div>
    </div>
    <!-- 白天进度条 -->
    <div class="day-bar-wrap">
      <span class="day-bar-icon">🌄</span>
      <div class="day-bar">
        <div class="day-bar-fill" :style="{ width: progress + '%' }"></div>
        <div class="day-bar-dot" :style="{ left: progress + '%' }">☀️</div>
      </div>
      <span class="day-bar-icon">🌇</span>
    </div>
    <span class="day-bar-label">{{ progressLabel }}</span>
    <template v-if="expanded">
      <div class="exp-info">
        <span>☀️ 日照时长：<b>{{ dayLength }}</b></span>
        <span>🕐 日出 {{ sunrise }} · 日落 {{ sunset }}</span>
      </div>
      <p class="exp-tip">💡 今日白天{{ dayLength }}，适合户外活动</p>
    </template>
  </div>
</template>

<style scoped>
.widget { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; }
.widget-title { font-size: 15px; color: #5a7a9a; margin: 0 0 10px 0; font-weight: 600; transition: color 0.8s ease; }
.widget-content { display: flex; align-items: center; gap: 20px; }
.metric { display: flex; flex-direction: column; align-items: center; }
.icon { font-size: 28px; margin-bottom: 4px; }
.metric-value { font-size: 26px; font-weight: 700; color: #2c3e50; line-height: 1.2; }
.metric-label { font-size: 12px; color: #99aabb; }
.divider { width: 1px; height: 50px; background: rgba(0,0,0,0.08); }
/* 进度条 */
.day-bar-wrap { display: flex; align-items: center; gap: 6px; width: 85%; margin-top: 12px; }
.day-bar-icon { font-size: 14px; flex-shrink: 0; }
.day-bar { flex: 1; height: 6px; background: linear-gradient(90deg, #ffc107, #ff9800, #e74c3c, #3498db); border-radius: 3px; position: relative; }
.day-bar-fill { position: absolute; left: 0; top: 0; height: 100%; background: rgba(255,255,255,0.5); border-radius: 3px; transition: width 0.5s ease; }
.day-bar-dot { position: absolute; top: 50%; transform: translate(-50%, -50%); font-size: 16px; transition: left 0.5s ease; }
.day-bar-label { font-size: 11px; color: #5a7a9a; margin-top: 6px; }
/* 展开 */
.sun-arc { width: 80%; margin: 16px 0 12px; }
.sun-track { position: relative; height: 40px; background: linear-gradient(180deg, rgba(255,193,7,0.2), rgba(52,152,219,0.1)); border-radius: 20px; }
.sun-dot { position: absolute; top: 50%; transform: translate(-50%, -50%); font-size: 18px; }
.exp-info { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 13px; color: #5a7a9a; margin-bottom: 8px; }
.exp-info b { color: #2c3e50; }
.exp-tip { font-size: 13px; color: #5a7a9a; margin-top: 4px; text-align: center; }
</style>
