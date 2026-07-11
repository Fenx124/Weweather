<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '../stores/user'

const emit = defineEmits<{
  close: []
}>()

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
      setTimeout(() => emit('close'), 800)
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
      setTimeout(() => emit('close'), 800)
    }
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') handleSubmit()
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-card">
      <!-- 标签切换 -->
      <div class="modal-tabs">
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
        <button class="modal-close" @click="emit('close')">✕</button>
      </div>

      <!-- 表单 -->
      <div class="modal-body" @keydown="handleKeydown">
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

        <!-- 提示信息 -->
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
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-card {
  background: #fff;
  border-radius: 20px;
  width: 400px;
  padding: 0;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease;
  overflow: hidden;
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-tabs {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding: 0 20px;
}

.tab-btn {
  flex: 1;
  padding: 16px 0;
  border: none;
  background: none;
  font-size: 16px;
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

.modal-close {
  border: none;
  background: none;
  font-size: 20px;
  color: #bbb;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.modal-close:hover {
  color: #333;
  background: #f5f5f5;
}

.modal-body {
  padding: 28px 32px 32px;
}

.input-group {
  margin-bottom: 18px;
}

.input-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #5a7a9a;
  margin-bottom: 6px;
}

.auth-input {
  width: 100%;
  padding: 12px 14px;
  border: 2px solid #e8f0f8;
  border-radius: 12px;
  font-size: 15px;
  color: #2c3e50;
  outline: none;
  transition: border-color 0.25s;
  box-sizing: border-box;
}

.auth-input:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.auth-input::placeholder {
  color: #bbb;
}

.msg {
  font-size: 13px;
  margin: 8px 0;
  padding: 8px 12px;
  border-radius: 8px;
}

.msg.error {
  color: #e74c3c;
  background: #fdf0ef;
}

.msg.success {
  color: #27ae60;
  background: #edfaf2;
}

.submit-btn {
  width: 100%;
  margin-top: 8px;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  letter-spacing: 2px;
}

.submit-btn:hover {
  background: linear-gradient(135deg, #5dade2, #2e86c1);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
  transform: translateY(-1px);
}
</style>
