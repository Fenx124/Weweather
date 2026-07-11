<script setup lang="ts">
defineProps<{
  humidity: number
  windSpeed: number
}>()
</script>

<template>
  <div class="widget">
    <h3 class="widget-title">💧 湿度 / 风速</h3>
    <div class="widget-content">
      <div class="metric">
        <span class="metric-value">{{ humidity }}</span>
        <span class="metric-unit">%</span>
        <span class="metric-label">湿度</span>
      </div>
      <div class="divider"></div>
      <div class="metric">
        <span class="metric-value">{{ windSpeed }}</span>
        <span class="metric-unit">m/s</span>
        <span class="metric-label">风速</span>
      </div>
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
  align-items: center;
  gap: 16px;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1.2;
}

.metric-unit {
  font-size: 13px;
  color: #5a7a9a;
  margin-bottom: 2px;
}

.metric-label {
  font-size: 12px;
  color: #99aabb;
}

.divider {
  width: 1px;
  height: 50px;
  background: rgba(0, 0, 0, 0.08);
}
</style>
