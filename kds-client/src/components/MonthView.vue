<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-serif text-[#3d3226]">{{ year }}年{{ month }}月 · 月计划</h2>
      <button @click="showForm = !showForm" class="px-4 py-2 bg-[#5c4a32] text-[#f7f7f5] rounded-xl text-sm hover:bg-[#3d3226] transition-colors">
        + 新建计划
      </button>
    </div>

    <!-- 新建表单 -->
    <Transition name="slide">
      <div v-if="showForm" class="bg-white rounded-2xl p-6 border border-[#e8e0d5] shadow-sm">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-xs text-[#8c7a60] font-medium mb-1.5 uppercase tracking-wide">科目</label>
            <select v-model="form.subject_id" class="w-full p-3 border border-[#e8e0d5] rounded-xl bg-[#fdfaf5] text-sm outline-none focus:border-[#c4a882]">
              <option value="">选择科目</option>
              <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-[#8c7a60] font-medium mb-1.5 uppercase tracking-wide">总工时 (h)</label>
            <input v-model.number="form.total_hours" type="number" min="1" step="0.5" placeholder="40"
              class="w-full p-3 border border-[#e8e0d5] rounded-xl bg-[#fdfaf5] text-sm outline-none focus:border-[#c4a882]" />
          </div>
        </div>
        <button @click="create" :disabled="!form.subject_id || !form.total_hours"
          class="w-full py-3 bg-[#5c4a32] text-white rounded-xl text-sm font-medium hover:bg-[#3d3226] disabled:opacity-30 transition-colors">
          创建月计划（自动均分 4 周）
        </button>
      </div>
    </Transition>

    <!-- 计划卡片列表 -->
    <div v-if="plans.length === 0" class="text-center py-20 text-[#c4b8a0] text-sm">
      暂无月计划，点击右上角创建
    </div>

    <div v-for="plan in plans" :key="plan.id"
      class="group bg-white rounded-2xl border border-[#e8e0d5] overflow-hidden shadow-sm
             hover:shadow-md hover:-translate-y-1 transition-all duration-500 ease-out cursor-pointer"
      :style="{ borderLeftWidth: '4px', borderLeftColor: plan.subject_color }"
      @click="$emit('select-plan', plan)"
    >
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <span class="text-xs font-medium px-2.5 py-1 rounded-lg" :style="{ background: plan.subject_color + '20', color: plan.subject_color }">
              {{ plan.subject_name }}
            </span>
            <span class="text-xs text-[#a6967c]">4 周 · 每周 {{ (plan.total_hours / 4).toFixed(1) }}h</span>
          </div>
          <button @click.stop="removePlan(plan.id)" class="text-[#d4b8a0] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>

        <!-- 总进度条 -->
        <div class="mb-3">
          <div class="flex justify-between text-xs text-[#8c7a60] mb-1.5">
            <span>总进度</span>
            <span>{{ plan.actual || 0 }}h / {{ plan.total_hours }}h</span>
          </div>
          <div class="h-2.5 bg-[#f0e8d8] rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-700 ease-out"
              :style="{ width: planPct(plan) + '%', background: plan.subject_color }"></div>
          </div>
        </div>

        <!-- 4 周概览 -->
        <div class="grid grid-cols-4 gap-2">
          <div v-for="w in 4" :key="w" class="text-center p-2 rounded-lg bg-[#fdfaf5]">
            <span class="block text-[10px] text-[#a6967c] mb-0.5">第{{ w }}周</span>
            <span class="text-xs font-medium text-[#5c4a32]">{{ (plan.total_hours / 4).toFixed(1) }}h</span>
          </div>
        </div>

        <div class="mt-4 text-xs text-[#c4a882] italic text-center">
          点击卡片进入周视图，调整每周计划
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getMonthPlans, createMonthPlan, deleteMonthPlan, getSubjects, getMonthlyStats } from '../api/index.js'

const props = defineProps({ year: Number, month: Number })
const emit = defineEmits(['select-plan'])
const plans = ref([])
const subjects = ref([])
const showForm = ref(false)
const form = reactive({ subject_id: '', total_hours: null })

async function load() {
  try {
    const [pRes, sRes] = await Promise.all([getMonthPlans(props.year, props.month), getSubjects()])
    const statsRes = await getMonthlyStats(props.year, props.month)
    const statMap = {}
    statsRes.data.data.subjects.forEach(s => { statMap[s.id] = s.actual })
    plans.value = pRes.data.data.map(p => ({ ...p, actual: statMap[p.subject_id] || 0 }))
    subjects.value = sRes.data.data
  } catch (e) { emit('toast', '加载失败') }
}

function planPct(p) { return p.total_hours > 0 ? Math.min(100, Math.round(((p.actual || 0) / p.total_hours) * 100)) : 0 }

async function create() {
  if (!form.subject_id || !form.total_hours) return
  try {
    await createMonthPlan({ subject_id: form.subject_id, year: props.year, month: props.month, total_hours: form.total_hours })
    showForm.value = false; form.subject_id = ''; form.total_hours = null
    emit('toast', '月计划已创建，4 周已自动均分')
    await load()
  } catch (e) { emit('toast', '创建失败') }
}

async function removePlan(id) {
  if (!confirm('删除该月计划？关联的周计划和日记录也会被删除')) return
  try { await deleteMonthPlan(id); emit('toast', '已删除'); await load() } catch (e) { emit('toast', '删除失败') }
}

onMounted(load)
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
