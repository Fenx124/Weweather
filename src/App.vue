<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { CurrentWeather, AirPollution } from './types/weather'
import { fetchWeather } from './services/weatherApi'
import WeatherDisplay from './components/WeatherDisplay.vue'
import WidgetHumidityWind from './components/WidgetHumidityWind.vue'
import WidgetSunriseSunset from './components/WidgetSunriseSunset.vue'
import WidgetAirQuality from './components/WidgetAirQuality.vue'
import WidgetFeelsLike from './components/WidgetFeelsLike.vue'

const searchQuery = ref('')
const weather = ref<CurrentWeather | null>(null)
const airPollution = ref<AirPollution | null>(null)
const loading = ref(false)
const errorMsg = ref('')

async function searchWeather() {
  const city = searchQuery.value.trim()
  if (!city) return

  loading.value = true
  errorMsg.value = ''
  try {
    const data = await fetchWeather(city)
    weather.value = data.weather
    airPollution.value = data.air
  } catch (e: any) {
    errorMsg.value = e.message || '搜索失败，请检查城市名称'
    weather.value = null
    airPollution.value = null
  } finally {
    loading.value = false
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    searchWeather()
  }
}

// 默认加载上海天气
onMounted(() => {
  searchQuery.value = '重庆'
  searchWeather()
})
</script>

<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="header-left">
        <h1 class="site-title">
          <span class="title-green">W</span><span class="title-green-sm">e</span><span class="title-blue">ather</span>
        </h1>
      </div>
      <div class="header-center">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="搜索城市，如：上海、北京、东京..."
            @keydown="handleKeydown"
          />
          <button class="search-btn" @click="searchWeather">搜索</button>
        </div>
      </div>
      <div class="header-right">
        <button class="login-btn">登录</button>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 左侧：天气显示大框 -->
      <section class="weather-display">
        <div class="weather-card">
          <!-- 加载状态 -->
          <div v-if="loading" class="status-box">
            <div class="spinner"></div>
            <p>正在获取天气...</p>
          </div>
          <!-- 错误状态 -->
          <div v-else-if="errorMsg" class="status-box error">
            <p class="error-text">{{ errorMsg }}</p>
          </div>
          <!-- 天气数据 -->
          <WeatherDisplay v-else-if="weather" :weather="weather" />
          <!-- 初始空状态 -->
          <div v-else class="status-box">
            <p class="placeholder-text">搜索城市查看天气</p>
          </div>
        </div>
      </section>

      <!-- 右侧：小组件区域 -->
      <aside class="widget-area">
        <div class="widget-card">
          <WidgetHumidityWind
            v-if="weather"
            :humidity="weather.humidity"
            :wind-speed="weather.windSpeed"
          />
          <div v-else class="empty-widget">--</div>
        </div>
        <div class="widget-card">
          <WidgetSunriseSunset
            v-if="weather"
            :sunrise="weather.sunrise"
            :sunset="weather.sunset"
          />
          <div v-else class="empty-widget">--</div>
        </div>
        <div class="widget-card">
          <WidgetAirQuality :air="airPollution" />
        </div>
        <div class="widget-card">
          <WidgetFeelsLike
            v-if="weather"
            :feels-like="weather.feelsLike"
            :temp="weather.temp"
          />
          <div v-else class="empty-widget">--</div>
        </div>
      </aside>
    </main>
  </div>
</template>

<style scoped>
/* ========== 全局 ========== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0f0ff 0%, #c8e0f8 50%, #b0d4f0 100%);
  display: flex;
  flex-direction: column;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}

/* ========== 顶部导航栏 ========== */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.header-left {
  flex: 1;
}

.site-title {
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-weight: 800;
  letter-spacing: -0.5px;
  user-select: none;
}

.title-green {
  background: linear-gradient(135deg, #2ecc71 0%, #1abc9c 50%, #27ae60 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 36px;
  font-weight: 900;
  text-shadow: none;
  filter: drop-shadow(0 2px 3px rgba(46, 204, 113, 0.25));
}

.title-green-sm {
  background: linear-gradient(135deg, #2ecc71 0%, #1abc9c 50%, #27ae60 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 30px;
  font-weight: 900;
  filter: drop-shadow(0 2px 3px rgba(46, 204, 113, 0.25));
}

.title-blue {
  background: linear-gradient(135deg, #5dade2 0%, #3498db 50%, #2471a3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 30px;
  font-weight: 800;
  filter: drop-shadow(0 2px 3px rgba(52, 152, 219, 0.25));
}

.header-center {
  flex: 2;
  display: flex;
  justify-content: center;
}

.search-box {
  display: flex;
  align-items: center;
  background: #e8f4fd;
  border: 2px solid #bcd4ec;
  border-radius: 28px;
  padding: 4px;
  box-shadow: 0 2px 12px rgba(52, 152, 219, 0.15);
  width: 100%;
  max-width: 420px;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.search-box:focus-within {
  border-color: #3498db;
  box-shadow: 0 2px 16px rgba(52, 152, 219, 0.3);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 10px 16px;
  font-size: 15px;
  border-radius: 28px;
  color: #2c3e50;
  background: transparent;
}

.search-input::placeholder {
  color: #aaa;
}

.search-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 28px;
  background: linear-gradient(135deg, #3498db, #2471a3);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
}

.search-btn:hover {
  background: linear-gradient(135deg, #5dade2, #2e86c1);
  box-shadow: 0 4px 16px rgba(52, 152, 219, 0.5);
  transform: translateY(-1px);
}

.header-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.login-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid #4a90d9;
  background: #fff;
  color: #4a90d9;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-btn:hover {
  background: #4a90d9;
  color: #fff;
  box-shadow: 0 4px 12px rgba(74, 144, 217, 0.4);
}

/* ========== 主内容区域 ========== */
.main-content {
  flex: 1;
  display: flex;
  gap: 24px;
  padding: 24px 32px;
  min-height: 0;
}

/* ========== 左侧天气显示 ========== */
.weather-display {
  flex: 7;
  min-width: 0;
}

.weather-card {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.9);
  transition: box-shadow 0.3s ease;
}

.weather-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

/* ========== 状态提示 ========== */
.status-box {
  text-align: center;
  color: #5a7a9a;
}

.status-box.error .error-text {
  color: #e74c3c;
  font-size: 16px;
  font-weight: 500;
}

.placeholder-text {
  color: #99aabb;
  font-size: 16px;
}

/* 加载动画 */
.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 12px auto;
  border: 4px solid rgba(74, 144, 217, 0.2);
  border-top-color: #4a90d9;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ========== 右侧小组件 ========== */
.widget-area {
  flex: 3;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 16px;
  min-width: 280px;
}

.widget-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.9);
  transition: box-shadow 0.3s ease;
}

.widget-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.empty-widget {
  font-size: 16px;
  color: #bbb;
}

/* ========== 响应式适配 ========== */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }

  .header-left,
  .header-center,
  .header-right {
    width: 100%;
    justify-content: center;
  }

  .main-content {
    flex-direction: column;
    padding: 16px;
  }

  .widget-area {
    grid-template-columns: 1fr 1fr;
    min-width: 0;
  }
}
</style>
