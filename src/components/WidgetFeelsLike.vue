<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  feelsLike: number
  temp: number
}>()

const diff = computed(() => {
  const d = props.feelsLike - props.temp
  if (d > 1) return '体感较热'
  if (d < -1) return '体感较凉'
  return '体感适中'
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
  gap: 6px;
}

.feels-temp {
  display: flex;
  align-items: flex-start;
}

.feels-value {
  font-size: 40px;
  font-weight: 300;
  color: #2c3e50;
  line-height: 1;
}

.feels-unit {
  font-size: 20px;
  color: #5a7a9a;
  margin-top: 4px;
}

.feels-desc {
  font-size: 13px;
  color: #5a7a9a;
  background: rgba(74, 144, 217, 0.1);
  padding: 4px 14px;
  border-radius: 12px;
}
</style>
