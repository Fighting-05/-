<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <button @click="$emit('back')" class="text-[#a6967c] hover:text-[#5c4a32] transition-colors flex items-center gap-1">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <h2 class="text-2xl font-serif text-[#3d3226]">{{ plan.subject_name }} · 周计划
        <span class="text-sm text-[#a6967c] ml-2 font-sans">{{ plan.year }}.{{ plan.month }}</span>
      </h2>
    </div>

    <!-- 超负荷预警 -->
    <div v-if="hasOverload" class="bg-[#fdf0ed] border border-[#e8c4b8] rounded-2xl p-4 flex items-start gap-3">
      <span class="text-lg">⚠️</span>
      <div>
        <strong class="text-sm text-[#a0523d]">计划已超负荷</strong>
        <p class="text-xs text-[#c4907a] mt-1">
          部分周每日需学习超过 8 小时，建议削减月目标或延长截止日期。
        </p>
      </div>
    </div>

    <!-- 周卡片 -->
    <div class="grid grid-cols-1 gap-4">
      <div v-for="(week, idx) in weeks" :key="week.id"
        class="bg-white rounded-2xl border border-[#e8e0d5] p-6 shadow-sm
               hover:shadow-md hover:-translate-y-0.5 transition-all duration-500 ease-out"
        :class="{ 'border-l-4': true }"
        :style="{ borderLeftColor: week.overloaded ? '#c4563a' : week.completion_pct >= 100 ? '#6a9e6a' : '#c4a882' }"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <span class="text-sm font-semibold text-[#3d3226]">第 {{ week.week_number }} 周</span>
            <span v-if="week.buffered" class="text-[10px] bg-[#fef3c7] text-[#92400e] px-2 py-0.5 rounded-full font-medium">
              缓冲 +{{ week.buffer_amount?.toFixed(1) }}h
            </span>
            <span v-if="week.overloaded" class="text-[10px] bg-[#fdf0ed] text-[#c4563a] px-2 py-0.5 rounded-full font-medium">
              超负荷
            </span>
          </div>
          <button @click="editWeek(week)" class="text-xs text-[#a6967c] hover:text-[#5c4a32] transition-colors">
            调整
          </button>
        </div>

        <!-- 进度条 -->
        <div class="mb-4">
          <div class="flex justify-between text-xs text-[#8c7a60] mb-1.5">
            <span>完成度 {{ week.completion_pct }}%</span>
            <span>{{ week.actual_hours }}h / {{ week.planned_hours.toFixed(1) }}h</span>
          </div>
          <div class="h-3 bg-[#f0e8d8] rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-700 ease-out"
              :style="{ width: week.completion_pct + '%', background: completionColor(week.completion_pct) }"></div>
          </div>
        </div>

        <!-- 日预估 + 进入按钮 -->
        <div class="flex items-center justify-between mt-3">
          <div class="flex items-center gap-2 text-xs text-[#a6967c]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            每日需学 <strong class="text-[#5c4a32]" :class="{ 'text-[#c4563a]': week.overloaded }">{{ week.per_day }}h</strong>
          </div>
          <button
            @click.stop="emit('selectWeek', week)"
            class="text-xs text-[#5c4a32] bg-[#f0e8d8] hover:bg-[#e0d4c0] px-3 py-1.5 rounded-lg transition-colors"
          >
            日记录 →
          </button>
        </div>

        <!-- 修改弹窗 -->
        <Transition name="fade">
          <div v-if="editing === week.id" class="mt-4 p-4 bg-[#fdfaf5] rounded-xl border border-[#e8e0d5]">
            <label class="block text-xs text-[#8c7a60] mb-2">调整本周计划工时</label>
            <div class="flex gap-2">
              <input v-model.number="editVal" type="number" min="0" step="0.5" class="flex-1 p-2 border border-[#e8e0d5] rounded-lg text-sm bg-white outline-none focus:border-[#c4a882]" />
              <button @click="saveWeek(week.id)" class="px-4 py-2 bg-[#5c4a32] text-white rounded-lg text-sm">保存</button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { getWeekPlans, updateWeekPlan } from '../api/index.js'

const props = defineProps({ plan: Object })
const emit = defineEmits(['back', 'selectWeek', 'toast'])

const weeks = ref([])
const editing = ref(null)
const editVal = ref(0)

const hasOverload = computed(() => weeks.value.some(w => w.overloaded))

function completionColor(pct) {
  if (pct >= 100) return 'linear-gradient(135deg, #6a9e6a, #4a7a4a)'
  if (pct >= 70) return 'linear-gradient(135deg, #8fbc8f, #6a9e6a)'
  if (pct >= 40) return 'linear-gradient(135deg, #c4a882, #b8956a)'
  return 'linear-gradient(135deg, #d4a04a, #c4904a)'
}

async function load() {
  try {
    const res = await getWeekPlans(props.plan.id)
    weeks.value = res.data.data
  } catch (e) { emit('toast', '加载周计划失败') }
}

function editWeek(week) {
  editing.value = week.id
  editVal.value = week.planned_hours
}

async function saveWeek(id) {
  try {
    await updateWeekPlan(id, editVal.value)
    editing.value = null
    await load()
  } catch (e) { /* */ }
}

watch(() => props.plan, () => { if (props.plan) load() }, { immediate: true })
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
