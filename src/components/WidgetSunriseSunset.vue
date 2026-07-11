<script setup lang="ts">
defineProps<{
  sunrise: string
  sunset: string
}>()
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

.icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1.2;
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
