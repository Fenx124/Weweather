<script setup lang="ts">
import type { CurrentWeather } from '../types/weather'
import { getWeatherIconUrl } from '../services/weatherApi'

defineProps<{
  weather: CurrentWeather
}>()
</script>

<template>
  <div class="weather-main">
    <div class="weather-header">
      <h2 class="city-name">{{ weather.cityName }}</h2>
      <p class="weather-desc">{{ weather.description }}</p>
    </div>

    <div class="weather-body">
      <img
        :src="getWeatherIconUrl(weather.icon)"
        :alt="weather.description"
        class="weather-icon"
      />
      <div class="temp-block">
        <span class="temp-value">{{ weather.temp }}</span>
        <span class="temp-unit">°C</span>
      </div>
    </div>

    <div class="weather-extra">
      <span class="extra-item">体感 {{ weather.feelsLike }}°C</span>
    </div>
  </div>
</template>

<style scoped>
.weather-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
}

.weather-header {
  text-align: center;
  margin-bottom: 16px;
}

.city-name {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 6px 0;
}

.weather-desc {
  font-size: 18px;
  color: #5a7a9a;
  margin: 0;
  text-transform: capitalize;
}

.weather-body {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.weather-icon {
  width: 120px;
  height: 120px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
}

.temp-block {
  display: flex;
  align-items: flex-start;
}

.temp-value {
  font-size: 96px;
  font-weight: 300;
  color: #2c3e50;
  line-height: 1;
}

.temp-unit {
  font-size: 36px;
  color: #5a7a9a;
  margin-top: 8px;
}

.weather-extra {
  display: flex;
  gap: 24px;
}

.extra-item {
  font-size: 15px;
  color: #5a7a9a;
  background: rgba(74, 144, 217, 0.1);
  padding: 6px 16px;
  border-radius: 20px;
}
</style>
