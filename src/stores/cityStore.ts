import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useCityStore = defineStore('city', () => {
  const cities = ref<string[]>([])
  const currentIndex = ref(0)

  const currentCity = computed(() => cities.value[currentIndex.value] || '')
  const hasCities = computed(() => cities.value.length > 0)
  const isCurrentDefault = computed(() => currentIndex.value === 0)

  /** 从 localStorage 加载用户城市列表 */
  function loadForUser(username: string) {
    const key = `weweather_cities_${username}`
    const saved = localStorage.getItem(key)
    if (saved) {
      const data = JSON.parse(saved) as { cities: string[]; current: number }
      cities.value = data.cities
      currentIndex.value = data.current ?? 0
    } else {
      cities.value = []
      currentIndex.value = 0
    }
  }

  /** 保存到 localStorage */
  function save() {
    const username = localStorage.getItem('weweather_user')
    if (!username) return
    const key = `weweather_cities_${username}`
    localStorage.setItem(
      key,
      JSON.stringify({ cities: cities.value, current: currentIndex.value }),
    )
  }

  /** 添加城市（不重复），默认切换到该城市 */
  function addCity(name: string) {
    if (!name) return
    const idx = cities.value.findIndex((c) => c === name)
    if (idx >= 0) {
      currentIndex.value = idx
    } else {
      cities.value.push(name)
      currentIndex.value = cities.value.length - 1
    }
    save()
  }

  /** 删除城市 */
  function removeCity(index: number) {
    if (cities.value.length <= 1) return
    cities.value.splice(index, 1)
    if (currentIndex.value >= cities.value.length) {
      currentIndex.value = cities.value.length - 1
    }
    save()
  }

  /** 设为默认（移到首位） */
  function setDefault(index: number) {
    if (index === 0) return
    const city = cities.value.splice(index, 1)[0]
    cities.value.unshift(city)
    currentIndex.value = 0
    save()
  }

  /** 切换到指定城市 */
  function switchTo(index: number) {
    if (index >= 0 && index < cities.value.length) {
      currentIndex.value = index
      save()
    }
  }

  return {
    cities,
    currentIndex,
    currentCity,
    hasCities,
    isCurrentDefault,
    loadForUser,
    addCity,
    removeCity,
    setDefault,
    switchTo,
  }
})
