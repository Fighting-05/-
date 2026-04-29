<template>
  <div v-if="checkingAuth" class="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
    <div class="text-gray-400 text-sm">加载中...</div>
  </div>

  <LoginPage v-else-if="!loggedIn" @login-success="loggedIn = true" />

  <div v-else class="min-h-screen bg-[#f8f9fc]">
    <div class="fixed top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-3 flex items-center justify-between">
      <span class="text-sm font-semibold text-gray-700">📖 考研动态调度执行系统 KDS</span>
      <button @click="doLogout" class="text-xs text-gray-400 hover:text-red-500 transition-colors">退出登录</button>
    </div>
    <div class="pt-12">
      <TaskBoard @toast="showToast" />
    </div>
    <Toast :message="toastMsg" :type="toastType" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LoginPage from './components/LoginPage.vue'
import TaskBoard from './components/TaskBoard.vue'
import Toast from './components/Toast.vue'
import { verifyToken } from './api/index.js'

const loggedIn = ref(false)
const checkingAuth = ref(true)

const toastMsg = ref('')
const toastType = ref('success')

onMounted(async () => {
  const token = localStorage.getItem('kds_token')
  if (token) {
    try { await verifyToken(); loggedIn.value = true } catch { /* */ }
  }
  checkingAuth.value = false
})

function showToast(msg, type = 'success') {
  toastMsg.value = msg; toastType.value = type
  setTimeout(() => { toastMsg.value = '' }, 2500)
}

function doLogout() {
  localStorage.removeItem('kds_token')
  loggedIn.value = false
}
</script>

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
</style>
