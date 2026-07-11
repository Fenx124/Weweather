import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const username = ref(localStorage.getItem('weweather_user') || '')
  const isLoggedIn = computed(() => username.value !== '')

  function login(name: string, password: string): { success: boolean; error?: string } {
    // 获取已注册用户
    const users = JSON.parse(localStorage.getItem('weweather_users') || '{}')
    if (!users[name]) {
      return { success: false, error: '用户不存在，请先注册' }
    }
    if (users[name] !== password) {
      return { success: false, error: '密码错误' }
    }
    username.value = name
    localStorage.setItem('weweather_user', name)
    return { success: true }
  }

  function register(name: string, password: string): { success: boolean; error?: string } {
    if (!name.trim() || !password.trim()) {
      return { success: false, error: '用户名和密码不能为空' }
    }
    if (password.length < 4) {
      return { success: false, error: '密码至少 4 位' }
    }
    const users = JSON.parse(localStorage.getItem('weweather_users') || '{}')
    if (users[name]) {
      return { success: false, error: '用户名已存在' }
    }
    users[name] = password
    localStorage.setItem('weweather_users', JSON.stringify(users))
    username.value = name
    localStorage.setItem('weweather_user', name)
    return { success: true }
  }

  function logout() {
    username.value = ''
    localStorage.removeItem('weweather_user')
  }

  return { username, isLoggedIn, login, register, logout }
})
