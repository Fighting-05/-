<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <button @click="$emit('back')" class="text-[#a6967c] hover:text-[#5c4a32] transition-colors flex items-center gap-1">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <h2 class="text-2xl font-serif text-[#3d3226]">日记录 · 第 {{ week.week_number }} 周</h2>
      <span class="text-sm text-[#a6967c]">{{ week.subject_name }}</span>
    </div>

    <!-- 记录表单 -->
    <div class="bg-white rounded-2xl border border-[#e8e0d5] p-6 shadow-sm">
      <h3 class="text-sm font-medium text-[#5c4a32] mb-4">记录今日学习</h3>
      <div class="flex items-end gap-3">
        <div class="flex-1">
          <label class="block text-xs text-[#8c7a60] mb-1.5 font-medium">学时 (h)</label>
          <input v-model.number="form.hours" type="number" min="0.5" step="0.5" placeholder="2.5"
            class="w-full p-3 border border-[#e8e0d5] rounded-xl text-sm bg-[#fdfaf5] outline-none focus:border-[#c4a882]" />
        </div>
        <div class="flex-[2]">
          <label class="block text-xs text-[#8c7a60] mb-1.5 font-medium">备注 (可选)</label>
          <input v-model="form.note" type="text" placeholder="完成了第三章习题"
            class="w-full p-3 border border-[#e8e0d5] rounded-xl text-sm bg-[#fdfaf5] outline-none focus:border-[#c4a882]" />
        </div>
        <button @click="log" :disabled="!form.hours"
          class="px-6 py-3 bg-[#5c4a32] text-white rounded-xl text-sm font-medium hover:bg-[#3d3226] disabled:opacity-30 transition-colors flex-shrink-0">
          记录
        </button>
      </div>
    </div>

    <!-- 今日记录列表 -->
    <div v-if="todayLogs.length > 0" class="bg-white rounded-2xl border border-[#e8e0d5] p-6 shadow-sm">
      <h3 class="text-sm font-medium text-[#5c4a32] mb-3">今日记录</h3>
      <div v-for="log in todayLogs" :key="log.id" class="flex items-center justify-between py-2 border-b border-[#f0e8d8] last:border-b-0">
        <span class="text-sm text-[#5c4a32]">{{ log.note || '未备注' }}</span>
        <span class="text-sm font-semibold text-[#5c4a32]">{{ log.hours }}h</span>
      </div>
      <div class="mt-3 pt-3 border-t border-[#e8e0d5] text-right">
        <span class="text-sm text-[#a6967c]">今日合计: <strong class="text-[#5c4a32]">{{ todayTotal }}h</strong></span>
      </div>
    </div>

    <!-- 本周每日记录 -->
    <div class="bg-white rounded-2xl border border-[#e8e0d5] p-6 shadow-sm">
      <h3 class="text-sm font-medium text-[#5c4a32] mb-4">本周完成情况</h3>
      <div class="grid grid-cols-7 gap-2">
        <div v-for="d in 7" :key="d" class="text-center p-3 rounded-xl text-xs"
          :class="dayRecord(d) > 0 ? 'bg-[#ecf7e8] border border-[#c4dcc0]' : 'bg-[#fdfaf5] border border-[#f0e8d8]'">
          <span class="block text-[10px] text-[#a6967c] mb-1">周{{ ['一','二','三','四','五','六','日'][d-1] }}</span>
          <span class="font-semibold text-[#5c4a32]">{{ dayRecord(d) }}h</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { getDailyLogs, createDailyLog } from '../api/index.js'

const props = defineProps({ week: Object })
const emit = defineEmits(['back'])

const logs = ref([])
const form = reactive({ hours: null, note: '' })

const todayStr = new Date().toISOString().slice(0, 10)
const todayLogs = computed(() => logs.value.filter(l => l.study_date === todayStr))
const todayTotal = computed(() => todayLogs.value.reduce((s, l) => s + l.hours, 0))

function dayRecord(dayOfWeek) {
  const weekStart = getWeekStart()
  const d = new Date(weekStart)
  d.setDate(d.getDate() + dayOfWeek - 1)
  const dateStr = d.toISOString().slice(0, 10)
  return logs.value.filter(l => l.study_date === dateStr).reduce((s, l) => s + l.hours, 0)
}

function getWeekStart() {
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(today.setDate(diff))
}

async function loadLogs() {
  try {
    const res = await getDailyLogs({ week_plan_id: props.week.id })
    logs.value = res.data.data
  } catch (e) { /* */ }
}

async function log() {
  if (!form.hours) return
  try {
    await createDailyLog({
      week_plan_id: props.week.id,
      subject_id: props.week.subject_id || 1,
      hours: form.hours,
      note: form.note
    })
    form.hours = null; form.note = ''
    emit('toast', '已记录')
    await loadLogs()
    emit('updated')
  } catch (e) { emit('toast', '记录失败') }
}

watch(() => props.week, () => { if (props.week) loadLogs() }, { immediate: true })
</script>
