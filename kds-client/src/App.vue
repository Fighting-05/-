<template>
  <div v-if="checkingAuth" class="min-h-screen flex items-center justify-center bg-[#f7f7f5]">
    <div class="text-[#a6967c] text-sm">加载中...</div>
  </div>

  <LoginPage v-else-if="!loggedIn" @login-success="loggedIn = true" />

  <div v-else class="min-h-screen bg-[#f7f7f5]">
    <SidebarNav v-if="currentView !== 'tasks'" :active="currentView" @navigate="switchView" @logout="doLogout" />
    <Toast :message="toastMsg" :type="toastType" />

    <!-- 任务看板全宽 -->
    <div v-if="currentView === 'tasks'">
      <div class="fixed top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-3 flex items-center gap-4">
        <button @click="currentView = 'month'" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="text-sm font-medium text-gray-500">← 返回</span>
      </div>
      <div class="pt-14">
        <TaskBoard @toast="showToast" />
      </div>
    </div>

    <main v-else class="pl-20 pr-8 py-10 max-w-4xl mx-auto">
      <!-- Month View -->
      <MonthView
        v-if="currentView === 'month'"
        :year="year" :month="month"
        @select-plan="selectPlan"
        @toast="showToast"
      />

      <!-- Week View -->
      <WeekView
        v-if="currentView === 'week' && selectedPlan"
        :plan="selectedPlan"
        @back="currentView = 'month'"
        @select-week="selectWeek"
        @toast="showToast"
      />
      <div v-else-if="currentView === 'week'" class="text-center py-20 text-[#a6967c]">
        <p class="text-lg mb-2">📋</p>
        <p>请先在月计划中选择一个科目计划</p>
        <button @click="currentView = 'month'" class="mt-4 text-[#5c4a32] underline text-sm">返回月计划</button>
      </div>

      <!-- Day View -->
      <DayView
        v-if="currentView === 'day' && selectedWeek"
        :week="selectedWeek"
        @back="currentView = 'week'"
        @toast="showToast"
        @updated="refreshWeeks"
      />
      <div v-else-if="currentView === 'day'" class="text-center py-20 text-[#a6967c]">
        <p class="text-lg mb-2">✍️</p>
        <p>请先在周计划中选择某一周</p>
        <button @click="currentView = 'week'" class="mt-4 text-[#5c4a32] underline text-sm">返回周计划</button>
      </div>

      <!-- Stats View -->
      <StatsView
        v-if="currentView === 'stats'"
        :year="year" :month="month"
      />

      <!-- Subjects Manager -->
      <SubjectManager
        v-if="currentView === 'subjects'"
        @toast="showToast"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LoginPage from './components/LoginPage.vue'
import SidebarNav from './components/SidebarNav.vue'
import Toast from './components/Toast.vue'
import MonthView from './components/MonthView.vue'
import WeekView from './components/WeekView.vue'
import DayView from './components/DayView.vue'
import StatsView from './components/StatsView.vue'
import SubjectManager from './components/SubjectManager.vue'
import TaskBoard from './components/TaskBoard.vue'
import { verifyToken, getMonthPlans, getWeekPlans } from './api/index.js'

const loggedIn = ref(false)
const checkingAuth = ref(true)

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)

const currentView = ref('month')
const selectedPlan = ref(null)
const selectedWeek = ref(null)

const toastMsg = ref('')
const toastType = ref('success')

// 自动登录
onMounted(async () => {
  const token = localStorage.getItem('kds_token')
  if (token) {
    try {
      await verifyToken()
      loggedIn.value = true
    } catch { /* token 失效，走登录页 */ }
  }
  checkingAuth.value = false
})

function showToast(msg, type = 'success') {
  toastMsg.value = msg; toastType.value = type
  setTimeout(() => { toastMsg.value = '' }, 2500)
}

async function switchView(view) {
  currentView.value = view
  if (view === 'month') {
    selectedPlan.value = null
    selectedWeek.value = null
  } else if (view === 'week') {
    selectedWeek.value = null
    if (!selectedPlan.value) {
      try {
        const res = await getMonthPlans(year.value, month.value)
        if (res.data.data.length > 0) selectedPlan.value = res.data.data[0]
      } catch { /* */ }
    }
  } else if (view === 'day') {
    // 确保有周计划选中
    if (!selectedWeek.value) {
      // 先确保有月计划
      if (!selectedPlan.value) {
        try {
          const res = await getMonthPlans(year.value, month.value)
          if (res.data.data.length > 0) selectedPlan.value = res.data.data[0]
        } catch { /* */ }
      }
      // 自动选当前周
      if (selectedPlan.value) {
        try {
          const res = await getWeekPlans(selectedPlan.value.id)
          if (res.data.data.length > 0) {
            const currentWeek = Math.ceil(new Date().getDate() / 7)
            const match = res.data.data.find(w => w.week_number === currentWeek)
            selectedWeek.value = match || res.data.data[0]
          }
        } catch { /* */ }
      }
    }
  }
}

function selectPlan(plan) {
  selectedPlan.value = plan
  currentView.value = 'week'
}

function selectWeek(week) {
  selectedWeek.value = week
  currentView.value = 'day'
}

function doLogout() {
  localStorage.removeItem('kds_token')
  loggedIn.value = false
}

function refreshWeeks() {
  // triggered after logging hours, WeekView handles its own reload
}
</script>

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
</style>
