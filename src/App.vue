<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { CurrentWeather, AirPollution } from './types/weather'
import { fetchWeather } from './services/weatherApi'
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

const searchQuery = ref('')
const suggestions = ref<{ name: string; nameEn: string }[]>([])
const showSuggestions = ref(false)
const weather = ref<CurrentWeather | null>(null)
const airPollution = ref<AirPollution | null>(null)
const loading = ref(false)
const errorMsg = ref('')

/** 天气数据缓存：cityName → { weather, air } */
const weatherCache = ref<Record<string, { weather: CurrentWeather; air: AirPollution }>>({})

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
}

/** 加载指定城市天气（优先用缓存，无缓存才请求） */
async function loadWeatherForCity(city: string) {
  // 命中缓存 → 秒切
  if (weatherCache.value[city]) {
    weather.value = weatherCache.value[city].weather
    airPollution.value = weatherCache.value[city].air
    return
  }
  // 无缓存 → 请求 API
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await fetchWeather(city)
    weather.value = data.weather
    airPollution.value = data.air
    weatherCache.value[city] = { weather: data.weather, air: data.air }
  } catch (e: any) {
    errorMsg.value = e.message || '搜索失败'
    weather.value = null
    airPollution.value = null
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

/** 设为默认城市 */
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
    cityStore.addCity('重庆')
    loadWeatherForCity('重庆')
  }
})

// 监听登录状态变化
watch(() => userStore.isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    cityStore.loadForUser(userStore.username)
    if (cityStore.hasCities) {
      loadWeatherForCity(cityStore.currentCity)
    }
  }
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
      <section class="weather-display">
        <div
          class="weather-card"
        >
          <!-- 城市操作按钮（非默认城市显示） -->
          <div v-if="weather && !cityStore.isCurrentDefault" class="city-actions">
            <button class="action-btn" @click="handleSetDefault(cityStore.currentIndex)">⭐ 设为默认</button>
            <button class="action-btn danger" @click="handleRemoveCity(cityStore.currentIndex)">🗑 删除</button>
          </div>

          <!-- 天气内容（带滑动动画） -->
          <Transition :name="slideDirection" mode="out-in">
            <!-- 加载状态 -->
            <div v-if="loading" key="loading" class="status-box">
              <div class="spinner"></div>
              <p>正在获取天气...</p>
            </div>
            <!-- 错误状态 -->
            <div v-else-if="errorMsg" key="error" class="status-box error">
              <p class="error-text">{{ errorMsg }}</p>
            </div>
            <!-- 天气数据 -->
            <WeatherDisplay v-else-if="weather" :key="cityStore.currentCity" :weather="weather" />
            <!-- 初始空状态 -->
            <div v-else key="empty" class="status-box">
              <p class="placeholder-text">搜索城市查看天气</p>
            </div>
          </Transition>
        </div>

        <!-- 城市切换栏 -->
        <div v-if="cityStore.cities.length > 0" class="city-bar">
          <button
            v-if="cityStore.cities.length > 1"
            class="nav-arrow"
            @click="prevCity"
          >◀</button>
          <div class="city-tabs">
            <button
              v-for="(city, idx) in cityStore.cities"
              :key="idx"
              :class="['city-tab', { active: idx === cityStore.currentIndex }]"
              @click="switchCity(idx, idx > cityStore.currentIndex ? 'left' : 'right')"
            >
              {{ city }}
              <span v-if="idx === 0" class="default-dot">●</span>
            </button>
          </div>
          <button
            v-if="cityStore.cities.length > 1"
            class="nav-arrow"
            @click="nextCity"
          >▶</button>
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

/* ========== 搜索建议下拉 ========== */
.search-box {
  position: relative;
}

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
  z-index: 200;
  overflow: hidden;
  animation: slideDown 0.2s ease;
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
  transition: background 0.15s;
}

.suggestion-item:hover {
  background: #e8f4fd;
}

.city-name {
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
}

.city-en {
  font-size: 12px;
  color: #99aabb;
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
}

/* ========== 左侧天气显示 ========== */
.weather-display {
  flex: 6;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  transition: box-shadow 0.3s ease;
  position: relative;
}

.weather-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

/* ========== 滑动切换动画 ========== */
.weather-card {
  overflow: hidden;
}

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
  transition: all 0.2s;
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
