<template>
  <div v-if="checkingAuth" class="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
    <div class="text-gray-400 text-sm">加载中...</div>
  </div>

  <LoginPage v-else-if="!loggedIn" @login-success="loggedIn = true" />

  <div v-else>
    <div class="fixed top-0 left-0 right-0 z-50 h-10 flex items-center justify-between px-6" style="background: rgba(10,10,16,0.5); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.04);">
      <span class="text-xs font-medium tracking-widest" style="font-family: 'Space Mono', monospace; color: rgba(255,255,255,0.2);">KDS</span>
      <button @click="doLogout" class="text-xs hover:text-red-400 transition-colors" style="color: rgba(255,255,255,0.2);">退出</button>
    </div>
    <TaskBoard @toast="showToast" />
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
