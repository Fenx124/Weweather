<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import type { CurrentWeather, AirPollution, Forecast } from './types/weather'
import { fetchWeather, fetchForecastSafe, getWeatherIconUrl } from './services/weatherApi'
import { useUserStore } from './stores/user'
import { useCityStore } from './stores/cityStore'
import { searchCities } from './data/cities'
import WeatherDisplay from './components/WeatherDisplay.vue'
import WidgetHumidityWind from './components/WidgetHumidityWind.vue'
import WidgetSunriseSunset from './components/WidgetSunriseSunset.vue'
import WidgetAirQuality from './components/WidgetAirQuality.vue'
import WidgetFeelsLike from './components/WidgetFeelsLike.vue'
import AuthModal from './components/AuthModal.vue'

const userStore = useUserStore()
const cityStore = useCityStore()
const showAuthModal = ref(false)
const showUserMenu = ref(false)
const showForecast = ref(false)
const expandedWidget = ref<string | null>(null)
const lastExpanded = ref<string>('feels')

/** 背景模式: 'auto' | 'day' | 'dusk' | 'night' */
const bgMode = ref<'auto' | 'day' | 'dusk' | 'night'>('auto')
const now = ref(new Date())

let bgTimer: ReturnType<typeof setInterval>
onMounted(() => { bgTimer = setInterval(() => now.value = new Date(), 60000) })

const timeOfDay = computed(() => {
  if (bgMode.value !== 'auto') return bgMode.value
  const h = now.value.getHours()
  if (h >= 6 && h < 17) return 'day'
  if (h >= 17 && h < 19) return 'dusk'
  return 'night'
})

function cycleBg() {
  const modes: Array<'auto' | 'day' | 'dusk' | 'night'> = ['auto', 'day', 'dusk', 'night']
  const i = modes.indexOf(bgMode.value)
  bgMode.value = modes[(i + 1) % modes.length] || 'auto'
}

// 背景平滑过渡（CSS gradient 无法直接 transition，用叠加层淡入淡出）
const prevBg = ref(timeOfDay.value)
const bgOverlay = ref(false)
watch(timeOfDay, (val, old) => {
  if (!old || val === old) return
  prevBg.value = old
  bgOverlay.value = true
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bgOverlay.value = false
    })
  })
})

// 预生成星星位置，避免每次渲染时 Math.random() 导致位置跳动
const stars = Array.from({ length: 30 }, () => ({
  left: Math.random() * 100,
  top: Math.random() * 60,
  delay: Math.random() * 3,
}))

const forecast = ref<Forecast | null>(null)
const forecastLoading = ref(false)

const searchQuery = ref('')
const suggestions = ref<{ name: string; nameEn: string }[]>([])
const showSuggestions = ref(false)
const weather = ref<CurrentWeather | null>(null)
const airPollution = ref<AirPollution | null>(null)
const loading = ref(false)
const errorMsg = ref('')

/** 天气数据缓存：cityName → { weather, air } */
const weatherCache = ref<Record<string, { weather: CurrentWeather; air: AirPollution }>>({})

/** 预报数据缓存：cityName → Forecast */
const forecastCache = ref<Record<string, Forecast>>({})

/** 滑动相关状态 */
const touchStartX = ref(0)
const touchDiff = ref(0)
const isSwiping = ref(false)
const slideDirection = ref<'slide-left' | 'slide-right'>('slide-right')

watch(searchQuery, (val) => {
  if (val.trim()) {
    suggestions.value = searchCities(val)
    showSuggestions.value = suggestions.value.length > 0
  } else {
    suggestions.value = []
    showSuggestions.value = false
  }
})

/** 搜索建议中选择城市 → 自动添加到城市列表 */
function selectCity(city: { name: string; nameEn: string }) {
  searchQuery.value = ''
  showSuggestions.value = false
  cityStore.addCity(city.name)
  loadWeatherForCity(city.name)
}

function hideSuggestions() {
  setTimeout(() => { showSuggestions.value = false }, 150)
}

/** 直接搜索按钮 */
function handleSearch() {
  const city = searchQuery.value.trim()
  if (!city) return
  showSuggestions.value = false
  cityStore.addCity(city)
  loadWeatherForCity(city)
  searchQuery.value = ''
}

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

function handleLogout() {
  userStore.logout()
  showUserMenu.value = false
  cityStore.reset()
  loadWeatherForCity('重庆')
}

/** 加载指定城市天气（缓存优先） */
async function loadWeatherForCity(city: string) {
  // 命中缓存 → 秒切
  if (weatherCache.value[city]) {
    weather.value = weatherCache.value[city].weather
    airPollution.value = weatherCache.value[city].air
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await fetchWeather(city)
    weather.value = data.weather
    airPollution.value = data.air
    weatherCache.value[city] = { weather: data.weather, air: data.air }
  } catch (e: any) {
    errorMsg.value = e.message || '搜索失败'
  } finally {
    loading.value = false
  }
}

/** 切换城市 */
function switchCity(index: number, dir?: 'left' | 'right') {
  if (index === cityStore.currentIndex) return
  slideDirection.value = dir === 'left' ? 'slide-left' : 'slide-right'
  cityStore.switchTo(index)
  loadWeatherForCity(cityStore.currentCity)
  if (showForecast.value) refreshForecast()
}

/** 左滑 */
function prevCity() {
  const idx = cityStore.currentIndex > 0 ? cityStore.currentIndex - 1 : cityStore.cities.length - 1
  switchCity(idx, 'right')
}

/** 右滑 */
function nextCity() {
  const idx = cityStore.currentIndex < cityStore.cities.length - 1 ? cityStore.currentIndex + 1 : 0
  switchCity(idx, 'left')
}

/* ========== 触摸/鼠标滑动 ========== */
function onTouchStart(e: TouchEvent) {
  if (cityStore.cities.length <= 1) return
  touchStartX.value = e.touches[0]?.clientX ?? 0
  touchDiff.value = 0
  isSwiping.value = true
}

function onTouchMove(e: TouchEvent) {
  if (!isSwiping.value) return
  touchDiff.value = (e.touches[0]?.clientX ?? 0) - touchStartX.value
}

function onTouchEnd() {
  if (!isSwiping.value) return
  isSwiping.value = false
  if (touchDiff.value > 60) {
    prevCity()
  } else if (touchDiff.value < -60) {
    nextCity()
  }
  touchDiff.value = 0
}

function onMouseDown(e: MouseEvent) {
  if (cityStore.cities.length <= 1) return
  touchStartX.value = e.clientX
  touchDiff.value = 0
  isSwiping.value = true
}

function onMouseMove(e: MouseEvent) {
  if (!isSwiping.value) return
  touchDiff.value = e.clientX - touchStartX.value
}

function onMouseUp() {
  if (!isSwiping.value) return
  isSwiping.value = false
  if (touchDiff.value > 60) {
    prevCity()
  } else if (touchDiff.value < -60) {
    nextCity()
  }
  touchDiff.value = 0
}

/** 展开/收起小组件 */
function toggleWidget(name: string) {
  if (expandedWidget.value === name) {
    expandedWidget.value = null
  } else {
    lastExpanded.value = name
    expandedWidget.value = name
  }
}

function handleWidgetClose() {
  expandedWidget.value = null
}
async function toggleForecast() {
  if (showForecast.value) {
    showForecast.value = false
    return
  }
  showForecast.value = true
  await refreshForecast()
}

async function refreshForecast() {
  const city = cityStore.currentCity
  // 命中缓存 → 秒显
  if (forecastCache.value[city]) {
    forecast.value = forecastCache.value[city]
    return
  }
  forecastLoading.value = true
  try {
    const data = await fetchForecastSafe(city)
    forecast.value = data
    forecastCache.value[city] = data
  } catch {
    forecast.value = null
  } finally {
    forecastLoading.value = false
  }
}

/* ====== 预报图表辅助函数 ====== */
function getFcPath2(hourly: { temp: number }[]): string {
  if (!hourly.length) return ''
  const pad = 6, cw = 100, ch = 28
  const t = hourly.map(h => h.temp)
  const max = Math.max(...t) + 2, min = Math.min(...t) - 2
  const r = max - min || 1
  const sx = (cw - pad * 2) / (hourly.length - 1)
  return hourly.map((h, i) => `${i === 0 ? 'M' : 'L'}${pad + i * sx},${pad + ((max - h.temp) / r) * (ch - pad * 2)}`).join(' ')
}

function getFcCy2(hourly: { temp: number }[], i: number): number {
  const pad = 6, ch = 28
  const t = hourly.map(h => h.temp)
  const max = Math.max(...t) + 2, min = Math.min(...t) - 2
  const item = hourly[i]
  if (!item) return pad
  return pad + ((max - item.temp) / (max - min || 1)) * (ch - pad * 2)
}

function getIcon(icon: string) { return getWeatherIconUrl(icon) }

function barStyle(d: { tempHigh: number; tempLow: number }) {
  if (!forecast.value) return { width: '50%', left: '0%' }
  const allTemps = forecast.value.daily.flatMap(d => [d.tempHigh, d.tempLow])
  const min = Math.min(...allTemps) - 1
  const max = Math.max(...allTemps) + 1
  const range = max - min || 1
  const l = ((d.tempLow - min) / range) * 100
  const r = ((d.tempHigh - min) / range) * 100
  const w = r - l
  return { width: `${Math.max(w, 5)}%`, left: `${l}%` }
}
function handleSetDefault(index: number) {
  cityStore.setDefault(index)
  loadWeatherForCity(cityStore.currentCity)
}

/** 删除城市 */
function handleRemoveCity(index: number) {
  cityStore.removeCity(index)
  if (cityStore.hasCities) {
    loadWeatherForCity(cityStore.currentCity)
  }
}

// 初始化
onMounted(() => {
  if (userStore.isLoggedIn) {
    cityStore.loadForUser(userStore.username)
  }
  if (cityStore.hasCities) {
    loadWeatherForCity(cityStore.currentCity)
  } else {
    // 未登录或无城市时，默认加载重庆
    cityStore.addCity('昆明')
    loadWeatherForCity('昆明')
  }
})

// 监听登录状态变化
watch(() => userStore.isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    cityStore.loadForUser(userStore.username)
    if (cityStore.hasCities) {
      loadWeatherForCity(cityStore.currentCity)
    } else {
      cityStore.reset()
      loadWeatherForCity('重庆')
    }
  }
})
</script>

<template>
  <div class="app-container" :class="'bg-' + timeOfDay">
    <!-- 背景层：当前主题（z-index: -2，在内容下方） -->
    <div class="bg-layer" :class="'bg-' + timeOfDay"></div>
    <!-- 背景过渡层：旧主题淡出（z-index: -1） -->
    <div v-if="prevBg !== timeOfDay || bgOverlay" class="bg-crossfade" :class="'bg-' + prevBg" :style="{ opacity: bgOverlay ? 1 : 0 }"></div>
    <!-- 夜晚星空 -->
    <div v-if="timeOfDay === 'night'" class="stars-layer">
      <span v-for="s in stars" :key="s.left + '-' + s.top" class="star" :style="{ left: s.left + '%', top: s.top + '%', animationDelay: s.delay + 's' }">✦</span>
    </div>
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
            @focus="searchQuery && suggestions.length > 0 && (showSuggestions = true)"
            @blur="hideSuggestions"
          />
          <button class="search-btn" @click="handleSearch()">搜索</button>
          <!-- 城市建议下拉 -->
          <ul v-if="showSuggestions" class="suggestions">
            <li
              v-for="(city, idx) in suggestions"
              :key="idx"
              class="suggestion-item"
              @mousedown.prevent="selectCity(city)"
            >
              <span class="city-name">{{ city.name }}</span>
              <span class="city-en">{{ city.nameEn }}</span>
            </li>
          </ul>
        </div>
      </div>
      <div class="header-right">
        <!-- 主题切换 -->
        <button class="bg-toggle" @click="cycleBg" :title="'背景: ' + bgMode">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 3h12l4 6-3 2-2-1v10H7V10L5 11l-3-2 4-6z"/>
          </svg>
        </button>
        <!-- 未登录 -->
        <button v-if="!userStore.isLoggedIn" class="login-btn" @click="showAuthModal = true">
          登录
        </button>
        <!-- 已登录 -->
        <div v-else class="user-area">
          <button class="user-btn" @click="toggleUserMenu">
            👤 {{ userStore.username }}
          </button>
          <div v-if="showUserMenu" class="user-menu">
            <button class="menu-item logout" @click="handleLogout">退出登录</button>
          </div>
        </div>
      </div>
    </header>

    <!-- 登录/注册弹窗 -->
    <AuthModal v-if="showAuthModal" @close="showAuthModal = false" />

    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 左侧：天气显示大框 -->
      <section :class="['weather-display', { expanded: showForecast }]">
        <div
          class="weather-card"
          :class="{ wide: showForecast }"
          @click="toggleForecast"
        >
          <!-- 城市操作按钮 -->
          <div v-if="weather && !cityStore.isCurrentDefault" class="city-actions">
            <button class="action-btn" @click.stop="handleSetDefault(cityStore.currentIndex)">⭐ 设为默认</button>
            <button class="action-btn danger" @click.stop="handleRemoveCity(cityStore.currentIndex)">🗑 删除</button>
          </div>

          <div class="weather-inner" :class="{ row: showForecast }">
            <!-- 天气内容 -->
            <div class="weather-main-col">
              <Transition :name="slideDirection" mode="out-in">
                <div v-if="loading" key="loading" class="status-box">
                  <div class="spinner"></div>
                  <p>正在获取天气...</p>
                </div>
                <div v-else-if="errorMsg" key="error" class="status-box error">
                  <p class="error-text">{{ errorMsg }}</p>
                </div>
                <WeatherDisplay v-else-if="weather" :key="cityStore.currentCity" :weather="weather" />
                <div v-else key="empty" class="status-box">
                  <p class="placeholder-text">搜索城市查看天气</p>
                </div>
              </Transition>
            </div>

            <!-- 展开的预报 -->
            <div v-if="showForecast" class="weather-forecast-col" @click.stop>
              <div v-if="forecastLoading" class="fc-loading"><div class="spinner"></div></div>
          <template v-else-if="forecast">
            <div class="fc-sec">
              <div class="fc-ttl">📈 12小时预报</div>
              <svg viewBox="0 0 100 28" class="fc-chart">
                <defs>
                  <linearGradient id="fcGrad3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#3498db" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#3498db" stop-opacity="0.02"/>
                  </linearGradient>
                </defs>
                <path :d="`${getFcPath2(forecast.hourly)} L94,24 L6,24 Z`" fill="url(#fcGrad3)"/>
                <path :d="getFcPath2(forecast.hourly)" fill="none" stroke="#3498db" stroke-width="0.6" stroke-linecap="round"/>
                <circle v-for="(_,i) in forecast.hourly" :key="i" :cx="6+i*(88/(forecast.hourly.length-1))" :cy="getFcCy2(forecast.hourly,i)" r="0.7" fill="#fff" stroke="#3498db" stroke-width="0.5"/>
              </svg>
              <div class="fc-hourly">
                <div v-for="(h,i) in forecast.hourly" :key="i" class="fc-h-cell">
                  <span class="fc-h-time">{{ h.time }}</span>
                  <img :src="getIcon(h.icon)" class="fc-h-icon" alt=""/>
                  <span class="fc-h-temp">{{ h.temp }}°</span>
                </div>
              </div>
            </div>
            <div class="fc-sec">
              <div class="fc-ttl">📅 七日预报</div>
              <div class="fc-daily">
                <div v-for="(d,i) in forecast.daily" :key="i" class="fc-d-row">
                  <span class="fc-d-day">{{ d.day }}</span>
                  <img :src="getIcon(d.icon)" class="fc-d-icon" alt=""/>
                  <span class="fc-d-desc">{{ d.desc }}</span>
                  <div class="fc-d-temps">
                    <span class="fc-t-high">{{ d.tempHigh }}°</span>
                    <span class="fc-t-bar"><span class="fc-t-fill" :style="barStyle(d)"/></span>
                    <span class="fc-t-low">{{ d.tempLow }}°</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
            </div>
          </div>
        </div>

        <!-- 城市切换栏 -->
        <div v-if="cityStore.cities.length > 0" class="city-bar">
          <button
            v-if="cityStore.cities.length > 1"
            class="nav-arrow"
            @click.stop="prevCity"
          >◀</button>
          <div class="city-tabs">
            <button
              v-for="(city, idx) in cityStore.cities"
              :key="idx"
              :class="['city-tab', { active: idx === cityStore.currentIndex }]"
              @click.stop="switchCity(idx, idx > cityStore.currentIndex ? 'left' : 'right')"
            >
              {{ city }}
              <span v-if="idx === 0" class="default-dot">●</span>
            </button>
          </div>
          <button
            v-if="cityStore.cities.length > 1"
            class="nav-arrow"
            @click.stop="nextCity"
          >▶</button>
        </div>
      </section>

      <!-- 右侧：小组件 -->
      <aside class="widget-area" :class="{ hidden: showForecast }">
        <div class="widget-grid">
        <div class="widget-card" @click.stop="toggleWidget('humidity')">
          <WidgetHumidityWind
            v-if="weather"
            :humidity="weather.humidity"
            :wind-speed="weather.windSpeed"
          />
          <div v-else class="empty-widget">--</div>
        </div>
        <div class="widget-card" @click.stop="toggleWidget('sunrise')">
          <WidgetSunriseSunset
            v-if="weather"
            :sunrise="weather.sunrise"
            :sunset="weather.sunset"
          />
          <div v-else class="empty-widget">--</div>
        </div>
        <div class="widget-card" @click.stop="toggleWidget('air')">
          <WidgetAirQuality :air="airPollution" />
        </div>
        <div class="widget-card" @click.stop="toggleWidget('feels')">
          <WidgetFeelsLike
            v-if="weather"
            :feels-like="weather.feelsLike"
            :temp="weather.temp"
          />
          <div v-else class="empty-widget">--</div>
        </div>
        </div>
        <!-- 展开的单个组件 -->
        <div
          class="widget-expanded"
          :class="[expandedWidget ? 'show' : '', 'from-' + lastExpanded]"
          @click.stop="expandedWidget = null"
        >
          <WidgetHumidityWind v-if="expandedWidget === 'humidity' && weather" :humidity="weather.humidity" :wind-speed="weather.windSpeed" expanded />
          <WidgetSunriseSunset v-if="expandedWidget === 'sunrise' && weather" :sunrise="weather.sunrise" :sunset="weather.sunset" expanded />
          <WidgetAirQuality v-if="expandedWidget === 'air'" :air="airPollution" expanded />
          <WidgetFeelsLike v-if="expandedWidget === 'feels' && weather" :feels-like="weather.feelsLike" :temp="weather.temp" expanded />
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
  display: flex;
  flex-direction: column;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  position: relative;
  overflow: hidden;
}

/* ========== 背景主题 ========== */
.bg-layer,
.bg-crossfade {
  position: fixed;
  inset: 0;
  pointer-events: none;
}
.bg-layer    { z-index: -2; }
.bg-crossfade { z-index: -1; transition: opacity 1.5s ease; }

.bg-day {
  background: linear-gradient(135deg, #e8f2fb 0%, #d4e6f9 50%, #c5ddf5 100%);
}

.bg-dusk {
  background: linear-gradient(180deg, #f9d56e 0%, #f5c456 30%, #fdf2d5 70%, #fffef9 100%);
}

.bg-night {
  background: linear-gradient(180deg, #2d3a5c 0%, #1a2744 30%, #0f1a30 70%, #0a0f1f 100%);
}

/* 夜晚星空 */
.stars-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}

.star {
  position: absolute;
  color: #fff;
  font-size: 8px;
  opacity: 0;
  animation: twinkle 3s ease-in-out infinite;
}

.star:nth-child(odd) { font-size: 6px; }
.star:nth-child(3n) { font-size: 10px; }

@keyframes twinkle {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.9; }
}

/* 主题切换按钮 */
.bg-toggle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #dde8f0;
  background: rgba(255,255,255,0.7);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.6s ease;
  line-height: 1;
  margin-right: 4px;
}

.bg-night .bg-toggle {
  opacity: 0.8;
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.15);
}
.bg-toggle:hover { opacity: 1; background: #3498db; border-color: #3498db; color: #fff; }

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
  transition: background 1s ease, border-color 1s ease;
  position: relative;
  z-index: 100;
}

.bg-night .header,
.bg-night .weather-card,
.bg-night .widget-card,
.bg-night .widget-expanded,
.bg-night .city-tab,
.bg-night .nav-arrow {
  background: rgba(255, 255, 255, 0.06) !important;
  backdrop-filter: blur(16px);
  border-color: rgba(255, 255, 255, 0.08) !important;
}

.bg-night .site-title,
.bg-night .fc-ttl,
.bg-night .fc-h-temp,
.bg-night .fc-h-time,
.bg-night .fc-d-desc,
.bg-night .fc-d-day {
  color: #cdd5df !important;
  text-shadow: 0 0 8px rgba(255,255,255,0.1);
  transition: color 0.8s ease;
}

/* 子组件内文字（用 :deep 穿透 scoped 样式） */
.bg-night :deep(.city-name),
.bg-night :deep(.temp-value),
.bg-night :deep(.temp-unit),
.bg-night :deep(.metric-value),
.bg-night :deep(.metric-unit),
.bg-night :deep(.feels-value),
.bg-night :deep(.feels-unit),
.bg-night :deep(.feels-desc),
.bg-night :deep(.widget-title),
.bg-night :deep(.extra-item) {
  color: #cdd5df !important;
  text-shadow: 0 0 8px rgba(255,255,255,0.1);
  transition: color 0.8s ease;
}

.bg-night :deep(.weather-desc),
.bg-night :deep(.metric-label),
.bg-night :deep(.metric-tag),
.bg-night :deep(.exp-tip),
.bg-night :deep(.detail-item),
.bg-night :deep(.exp-info),
.bg-night :deep(.day-bar-label),
.bg-night :deep(.exp-bar-label),
.bg-night :deep(.exp-bar-val),
.bg-night :deep(.no-data) {
  color: #aabbcc !important;
  transition: color 0.8s ease;
}

.bg-night .fc-d-row:hover { background: rgba(255,255,255,0.06); }
.bg-night .fc-t-bar { background: rgba(255,255,255,0.1); }

.bg-night .search-box {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.12);
}

.bg-night .search-input { color: #cdd5df; }
.bg-night .search-input::placeholder { color: #667788; }
.bg-night .suggestions {
  background: #1e2d45;
  box-shadow: 0 8px 30px rgba(0,0,0,0.4);
}
.bg-night .suggestion-item { color: #cdd5df; }
.bg-night .suggestion-item:hover { background: rgba(255,255,255,0.08); }
.bg-night .suggestion-item .city-name { color: #cdd5df; }
.bg-night .suggestion-item .city-en { color: #8899aa; }
.bg-night .login-btn,
.bg-night .user-btn {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.15);
  color: #c0ccdd;
}

.bg-night .action-btn {
  background: rgba(0,0,0,0.3);
  border-color: rgba(255,255,255,0.08);
  color: #8899aa;
}

.bg-night .city-tab.active {
  background: rgba(52,152,219,0.5);
  border-color: rgba(52,152,219,0.6);
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
  position: relative;
  display: flex;
  align-items: center;
  background: #e8f4fd;
  border: 2px solid #bcd4ec;
  border-radius: 28px;
  padding: 4px;
  box-shadow: 0 2px 12px rgba(52, 152, 219, 0.15);
  width: 100%;
  max-width: 420px;
  transition: background 1s ease, border-color 0.3s, box-shadow 0.3s;
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
  transition: color 0.8s ease;
}

.search-input::placeholder {
  color: #aaa;
  transition: color 0.8s ease;
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

/* ========== 搜索建议下拉 ========== */
.suggestions {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  list-style: none;
  margin: 0;
  padding: 6px;
  z-index: 300;
  overflow: hidden;
  animation: slideDown 0.2s ease;
  transition: background 1s ease, box-shadow 0.3s;
}

@keyframes slideDown {
  from { transform: translateY(-8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s, color 0.8s ease;
}

.suggestion-item:hover {
  background: #e8f4fd;
}

.suggestion-item .city-name {
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
  transition: color 0.8s ease;
}

.suggestion-item .city-en {
  font-size: 12px;
  color: #99aabb;
  transition: color 0.8s ease;
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

/* ========== 用户区域 ========== */
.user-area {
  position: relative;
}

.user-btn {
  padding: 8px 18px;
  border: 2px solid #3498db;
  border-radius: 22px;
  background: #fff;
  color: #3498db;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-btn:hover {
  background: #3498db;
  color: #fff;
}

.user-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 100;
  animation: menuSlide 0.2s ease;
}

@keyframes menuSlide {
  from { transform: translateY(-8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.menu-item {
  display: block;
  width: 100%;
  padding: 12px 20px;
  border: none;
  background: none;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.menu-item.logout {
  color: #e74c3c;
}

.menu-item:hover {
  background: #f5f7fa;
}

/* ========== 主内容区域 ========== */
.main-content {
  flex: 1;
  display: flex;
  gap: 24px;
  padding: 24px 32px;
  min-height: 0;
  position: relative;
}

/* ========== 左侧天气显示 ========== */
.weather-display {
  flex: 6;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  transition: flex 0.45s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.weather-card {
  width: 100%;
  flex: 1;
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
  transition: background 1s ease, border-color 1s ease,
              box-shadow 0.35s cubic-bezier(0.25, 0.8, 0.25, 1),
              transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  cursor: pointer;
}

.weather-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 40px rgba(52, 152, 219, 0.18);
  border-color: rgba(52, 152, 219, 0.3);
  background: rgba(240, 248, 255, 0.85);
}

/* ========== 天气卡片展开态 ========== */
.weather-display.expanded {
  flex: 10;
  z-index: 50;
}

.weather-card.wide {
  flex-direction: column;
  align-items: stretch;
  padding: 16px 20px;
}

.weather-card.wide:hover {
  transform: none;
}

.weather-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.weather-inner.row {
  flex-direction: row;
  align-items: stretch;
  gap: 14px;
}

.weather-main-col {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.weather-forecast-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 14px;
  border-left: 1px solid rgba(0,0,0,0.08);
  min-width: 0;
  position: relative;
  animation: fcFadeIn 0.3s 0.1s forwards;
  opacity: 0;
  gap: 10px;
}

@keyframes fcFadeIn {
  to { opacity: 1; }
}

/* ========== 滑动切换动画 ========== */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1.2);
  position: absolute;
  width: 100%;
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-60%);
  opacity: 0;
}

.slide-right-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(60%);
  opacity: 0;
}

/* ========== 预报内部公共样式 ========== */
.fc-close {
  position: absolute; top: -2px; right: -2px;
  border: none; background: rgba(0,0,0,0.05); color: #999;
  font-size: 14px; cursor: pointer; width: 24px; height: 24px;
  border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 2;
}
.fc-close:hover { background: rgba(0,0,0,0.1); color: #333; }

.fc-loading { display: flex; align-items: center; justify-content: center; height: 100%; }

.fc-sec { flex: 0 1 auto; min-height: 0; display: flex; flex-direction: column; }

.fc-ttl { font-size: 11px; font-weight: 700; color: #3498db; margin-bottom: 2px; flex-shrink: 0; transition: color 0.8s ease; }

.fc-chart { width: 100%; height: auto; margin-bottom: 2px; flex-shrink: 0; }

.fc-hourly { display: flex; justify-content: space-between; gap: 1px; flex-shrink: 0; }

.fc-h-cell { display: flex; flex-direction: column; align-items: center; min-width: 38px; flex-shrink: 0; }

.fc-h-time { font-size: 9px; color: #99aabb; transition: color 0.8s ease; }

.fc-h-icon { width: 17px; height: 17px; }

.fc-h-temp { font-size: 10px; font-weight: 700; color: #2c3e50; transition: color 0.8s ease; }

.fc-daily { display: flex; flex-direction: column; gap: 0; flex: 0 1 auto; }

.fc-d-row {
  display: flex; align-items: center; gap: 4px;
  padding: 1px 4px; border-radius: 6px; transition: background 0.15s; flex-shrink: 0;
}

.fc-d-row:hover { background: rgba(52,152,219,0.06); }

.fc-d-day { font-size: 10px; font-weight: 600; color: #2c3e50; width: 26px; flex-shrink: 0; transition: color 0.8s ease; }

.fc-d-icon { width: 18px; height: 18px; }

.fc-d-desc { font-size: 10px; color: #5a7a9a; width: 30px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color 0.8s ease; }

.fc-d-temps { flex: 1; display: flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 700; }

.fc-t-high { color: #e74c3c; width: 30px; text-align: right; flex-shrink: 0; }

.fc-t-low { color: #3498db; width: 30px; text-align: left; flex-shrink: 0; }

.fc-t-bar { flex: 1; height: 4px; background: #dde4ed; border-radius: 2px; position: relative; }

.fc-t-fill {
  position: absolute; top: 0; height: 100%;
  background: linear-gradient(90deg, #3498db, #e74c3c); border-radius: 1px;
  min-width: 4px;
}

/* ========== 城市操作按钮 ========== */
.city-actions {
  position: absolute;
  top: 16px;
  right: 20px;
  display: flex;
  gap: 8px;
  z-index: 10;
}

.action-btn {
  padding: 5px 14px;
  border: 1px solid #dde8f0;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.85);
  color: #5a7a9a;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  backdrop-filter: blur(4px);
}

.action-btn:hover {
  background: #e8f4fd;
  border-color: #3498db;
  color: #3498db;
}

.action-btn.danger:hover {
  background: #fdf0ef;
  border-color: #e74c3c;
  color: #e74c3c;
}

/* ========== 城市切换栏 ========== */
.city-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 4px;
}

.nav-arrow {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #dde8f0;
  background: rgba(255, 255, 255, 0.75);
  color: #5a7a9a;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.6s ease;
  flex-shrink: 0;
  backdrop-filter: blur(8px);
}

.nav-arrow:hover {
  background: #3498db;
  color: #fff;
  border-color: #3498db;
}

.city-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  flex: 1;
  padding: 2px 0;
}

.city-tabs::-webkit-scrollbar {
  height: 0;
}

.city-tab {
  padding: 7px 16px;
  border: 1px solid #dde8f0;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.7);
  color: #5a7a9a;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}

.city-tab:hover {
  border-color: #3498db;
  color: #3498db;
}

.city-tab.active {
  background: #3498db;
  color: #fff;
  border-color: #3498db;
  font-weight: 700;
}

.default-dot {
  font-size: 8px;
  color: #2ecc71;
}

.city-tab.active .default-dot {
  color: #fff;
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
  flex: 4;
  min-width: 0;
  position: relative;
  transition: flex 0.45s cubic-bezier(0.25, 0.8, 0.25, 1),
              opacity 0.25s ease;
  overflow: hidden;
}

.widget-area.hidden {
  flex: 0;
  opacity: 0;
  pointer-events: none;
  min-width: 0;
}

.widget-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 16px;
  height: 100%;
  opacity: 1;
  transition: opacity 0.25s ease;
}

.widget-grid[style*="display: none"] {
  display: none !important;
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
  transition: background 1s ease, border-color 1s ease,
              all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
}

.widget-expanded {
  position: absolute;
  inset: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(52, 152, 219, 0.15);
  cursor: pointer;
  transform: scale(0.3);
  opacity: 0;
  pointer-events: none;
  transition: background 1s ease, border-color 1s ease,
              transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1),
              opacity 0.3s ease,
              border-radius 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.widget-expanded.show {
  transform: scale(1);
  opacity: 1;
  pointer-events: auto;
  border-radius: 20px;
}

.widget-expanded.from-humidity  { transform-origin: top left; }
.widget-expanded.from-sunrise   { transform-origin: top right; }
.widget-expanded.from-air       { transform-origin: bottom left; }
.widget-expanded.from-feels     { transform-origin: bottom right; }

.widget-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(52, 152, 219, 0.16);
  border-color: rgba(52, 152, 219, 0.25);
  background: rgba(240, 248, 255, 0.85);
}

.empty-widget {
  font-size: 16px;
  color: #bbb;
}

/* widget 内文字基础色（配合夜间模式过渡） */
:deep(.widget-title) { transition: color 0.8s ease; }
:deep(.metric-value),
:deep(.feels-value) { color: #2c3e50; transition: color 0.8s ease; }
:deep(.metric-unit),
:deep(.feels-unit),
:deep(.feels-desc) { color: #5a7a9a; transition: color 0.8s ease; }
:deep(.metric-label),
:deep(.metric-tag),
:deep(.exp-tip),
:deep(.exp-info),
:deep(.day-bar-label),
:deep(.exp-bar-label),
:deep(.exp-bar-val) { color: #5a7a9a; transition: color 0.8s ease; }

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

  .widget-grid {
    grid-template-columns: 1fr 1fr;
    min-width: 0;
  }
}
</style>

<style>
html, body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}
</style>
