<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const tab = ref<'login' | 'register'>('login')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const successMsg = ref('')

function reset() {
  username.value = ''
  password.value = ''
  confirmPassword.value = ''
  errorMsg.value = ''
  successMsg.value = ''
}

function switchTab(t: 'login' | 'register') {
  tab.value = t
  reset()
}

async function handleSubmit() {
  errorMsg.value = ''
  successMsg.value = ''

  if (tab.value === 'login') {
    const result = userStore.login(username.value, password.value)
    if (!result.success) {
      errorMsg.value = result.error || '登录失败'
    } else {
      successMsg.value = '登录成功！'
      setTimeout(() => router.push('/'), 800)
    }
  } else {
    if (password.value !== confirmPassword.value) {
      errorMsg.value = '两次密码输入不一致'
      return
    }
    const result = userStore.register(username.value, password.value)
    if (!result.success) {
      errorMsg.value = result.error || '注册失败'
    } else {
      successMsg.value = '注册成功，已自动登录！'
      setTimeout(() => router.push('/'), 800)
    }
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') handleSubmit()
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <!-- 标签切换 -->
      <div class="login-tabs">
        <button
          :class="['tab-btn', { active: tab === 'login' }]"
          @click="switchTab('login')"
        >
          登录
        </button>
        <button
          :class="['tab-btn', { active: tab === 'register' }]"
          @click="switchTab('register')"
        >
          注册
        </button>
      </div>

      <!-- 表单 -->
      <div class="login-body" @keydown="handleKeydown">
        <div class="input-group">
          <label>用户名</label>
          <input
            v-model="username"
            type="text"
            class="auth-input"
            placeholder="请输入用户名"
          />
        </div>

        <div class="input-group">
          <label>密码</label>
          <input
            v-model="password"
            type="password"
            class="auth-input"
            placeholder="请输入密码"
          />
        </div>

        <div v-if="tab === 'register'" class="input-group">
          <label>确认密码</label>
          <input
            v-model="confirmPassword"
            type="password"
            class="auth-input"
            placeholder="请再次输入密码"
          />
        </div>

        <p v-if="errorMsg" class="msg error">{{ errorMsg }}</p>
        <p v-if="successMsg" class="msg success">{{ successMsg }}</p>

        <button class="submit-btn" @click="handleSubmit">
          {{ tab === 'login' ? '登 录' : '注 册' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8f2fb 0%, #d4e6f9 50%, #c5ddf5 100%);
}

.login-card {
  background: #fff;
  border-radius: 20px;
  width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  animation: slideUp 0.4s ease;
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.login-tabs {
  display: flex;
  border-bottom: 1px solid #eee;
}

.tab-btn {
  flex: 1;
  padding: 18px 0;
  border: none;
  background: none;
  font-size: 17px;
  font-weight: 600;
  color: #999;
  cursor: pointer;
  transition: all 0.25s;
  position: relative;
}

.tab-btn.active {
  color: #3498db;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 25%;
  right: 25%;
  height: 3px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-radius: 3px;
}

.login-body {
  padding: 32px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #5a7a9a;
  margin-bottom: 6px;
}

.auth-input {
  width: 100%;
  padding: 12px 14px;
  border: 2px solid #dde8f0;
  border-radius: 12px;
  font-size: 15px;
  color: #2c3e50;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.auth-input:focus {
  border-color: #3498db;
}

.msg {
  text-align: center;
  font-size: 14px;
  margin: 0 0 16px 0;
  padding: 8px;
  border-radius: 8px;
}

.msg.error {
  color: #e74c3c;
  background: #fdf0ef;
}

.msg.success {
  color: #27ae60;
  background: #eafaf1;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #3498db, #2471a3);
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 16px rgba(52, 152, 219, 0.3);
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(52, 152, 219, 0.4);
}
</style>
