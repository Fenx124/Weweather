<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  sunrise: string
  sunset: string
  expanded?: boolean
}>()

const dayLength = computed(() => {
  const [sh = 0, sm = 0] = props.sunrise.split(':').map(Number)
  const [eh = 0, em = 0] = props.sunset.split(':').map(Number)
  const totalMin = (eh * 60 + em) - (sh * 60 + sm)
  return `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`
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
    <template v-if="expanded">
      <div class="sun-arc">
        <div class="sun-track">
          <div class="sun-dot" style="left: 15%">🌄</div>
          <div class="sun-dot" style="left: 50%">☀️</div>
          <div class="sun-dot" style="left: 85%">🌇</div>
        </div>
      </div>
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
.widget-title { font-size: 15px; color: #5a7a9a; margin: 0 0 10px 0; font-weight: 600; }
.widget-content { display: flex; align-items: center; gap: 20px; }
.metric { display: flex; flex-direction: column; align-items: center; }
.icon { font-size: 28px; margin-bottom: 4px; }
.metric-value { font-size: 26px; font-weight: 700; color: #2c3e50; line-height: 1.2; }
.metric-label { font-size: 12px; color: #99aabb; }
.divider { width: 1px; height: 50px; background: rgba(0,0,0,0.08); }
.sun-arc { width: 80%; margin: 16px 0 12px; }
.sun-track { position: relative; height: 40px; background: linear-gradient(180deg, rgba(255,193,7,0.2), rgba(52,152,219,0.1)); border-radius: 20px; }
.sun-dot { position: absolute; top: 50%; transform: translate(-50%, -50%); font-size: 18px; }
.exp-info { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 13px; color: #5a7a9a; margin-bottom: 8px; }
.exp-info b { color: #2c3e50; }
.exp-tip { font-size: 13px; color: #5a7a9a; margin-top: 4px; text-align: center; }
</style>
