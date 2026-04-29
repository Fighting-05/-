<template>
  <div class="min-h-screen bg-[#f8f9fc]">
    <!-- 顶部渐变横幅 -->
    <div class="text-white transition-colors duration-500" :style="{ background: currentSubject ? `linear-gradient(135deg, ${currentSubject.color}, ${currentSubject.color}dd)` : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }">
      <div class="max-w-6xl mx-auto px-8 py-8">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-white/60 text-sm font-medium tracking-wide uppercase">考研任务管理</p>
            <h1 class="text-3xl font-bold mt-1 tracking-tight">{{ currentStage ? currentStage.name : '选择阶段' }}</h1>
            <div class="flex items-center gap-4 mt-3 text-sm text-white/80">
              <span class="flex items-center gap-1.5"><svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>{{ totalTasks }} 个子任务</span>
              <span class="flex items-center gap-1.5"><svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>{{ completedTasks }} 已完成</span>
              <span class="flex items-center gap-1.5"><svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{{ totalHours.toFixed(1) }}h 总时长</span>
            </div>
          </div>
          <div class="relative flex-shrink-0">
            <svg class="size-28 -rotate-90 drop-shadow-lg">
              <circle cx="56" cy="56" r="48" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="8"/>
              <circle cx="56" cy="56" r="48" fill="none" stroke="white" stroke-width="8" stroke-linecap="round"
                :stroke-dasharray="301.6" :stroke-dashoffset="301.6 - (totalTasks > 0 ? (completedTasks / totalTasks) * 301.6 : 0)" class="transition-all duration-1000 ease-out"/>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-2xl font-bold">{{ totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0 }}%</span>
              <span class="text-[10px] text-white/60">完成率</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="max-w-6xl mx-auto px-8 -mt-4 pb-16">
      <!-- 科目选择器 -->
      <div class="flex gap-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 mb-5 w-fit">
        <button v-for="subj in subjects" :key="subj.id" @click="selectSubject(subj)"
          class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 group/subj relative"
          :class="currentSubject?.id === subj.id ? 'text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'"
          :style="currentSubject?.id === subj.id ? { background: subj.color } : {}">
          <span>{{ subjectIcons[subj.name] || '📖' }}</span> {{ subj.name }}
          <button v-if="subjects.length > 1" @click.stop="removeSubject(subj)"
            class="absolute -top-1 -right-1 size-4 rounded-full bg-red-400 text-white flex items-center justify-center opacity-0 group-hover/subj:opacity-100 transition-opacity hover:bg-red-500">
            <svg class="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </button>
        <button @click="addSubject" class="px-3 py-2 rounded-xl text-sm text-gray-300 hover:text-gray-500 transition-colors" title="新增科目">+</button>
      </div>

      <!-- 阶段选择器 -->
      <div v-if="currentSubject" class="flex gap-1.5 flex-wrap mb-6">
        <button v-for="st in currentStages" :key="st.id" @click="selectStage(st)"
          class="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border group/st relative"
          :class="currentStage?.id === st.id ? 'text-white border-transparent shadow-sm' : 'text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'"
          :style="currentStage?.id === st.id ? { background: currentSubject.color, borderColor: currentSubject.color } : {}">
          {{ st.name }}
          <button v-if="currentStages.length > 1" @click.stop="removeStage(st)"
            class="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-red-400 text-white flex items-center justify-center opacity-0 group-hover/st:opacity-100 transition-opacity hover:bg-red-500">
            <svg class="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </button>
        <button @click="addStage" class="px-3 py-1.5 rounded-lg text-xs text-gray-300 border border-dashed border-gray-200 hover:border-gray-400 hover:text-gray-500 transition-colors">+ 添加阶段</button>
      </div>
      <!-- Tab 切换 -->
      <div class="flex gap-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 mb-6 w-fit">
        <button v-for="tab in tabs" :key="tab.key" @click="viewMode = tab.key"
          class="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2"
          :class="viewMode === tab.key ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'">
          <span class="text-base">{{ tab.icon }}</span> {{ tab.label }}
        </button>
      </div>

      <!-- 统计卡片行 -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div v-for="card in statCards" :key="card.label"
          class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all duration-300 group">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wider">{{ card.label }}</span>
            <div class="size-9 rounded-xl flex items-center justify-center" :style="{ background: card.bg }">
              <span class="text-sm">{{ card.icon }}</span>
            </div>
          </div>
          <div class="text-2xl font-bold text-gray-900">{{ card.value }}</div>
          <div class="text-xs mt-1" :class="card.trend > 0 ? 'text-emerald-500' : 'text-gray-400'">{{ card.sub }}</div>
        </div>
      </div>

      <!-- 看板视图 -->
      <div v-if="viewMode === 'board'" class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div v-for="pt in parentTasks" :key="pt.id"
          @click="expandedId === pt.id ? expandedId = null : openParent(pt)"
          class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden group"
          :class="{ 'ring-2 ring-indigo-200': expandedId === pt.id, 'opacity-50 grayscale': !pt.active }">
          <!-- 头部 -->
          <div class="p-5">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="size-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg"
                  :style="{ background: parentColor(pt) }">
                  {{ pt.name.charAt(0) }}
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900 text-sm leading-tight">{{ pt.name }}</h3>
                  <p class="text-xs text-gray-400 mt-0.5">{{ activeTasksFor(pt.id) }} 个待完成</p>
                </div>
              </div>
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
                <button @click="toggleActive(pt)" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors" :title="pt.active ? '隐藏' : '显示'">
                  <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                <button @click="addChildTask(pt)" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-indigo-400 transition-colors" title="添加子任务">
                  <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>
            </div>
            <!-- 进度条 -->
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500" :style="{ width: getParentProgress(pt.id) + '%', background: parentColor(pt) }" />
            </div>
            <div class="flex justify-between mt-1.5 text-xs text-gray-400">
              <span>{{ getDoneCount(pt.id) }}/{{ getTotalCount(pt.id) }} 已完成</span>
              <span class="font-medium" :style="{ color: parentColor(pt) }">{{ getParentProgress(pt.id) }}%</span>
            </div>
          </div>

          <!-- 子任务展开 -->
          <Transition name="expand">
            <div v-if="expandedId === pt.id" class="border-t border-gray-50" @click.stop>
              <div v-if="childTasks[pt.id]?.length" class="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
                <div v-for="(ct, idx) in childTasks[pt.id]" :key="ct.id"
                  class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors group/item">
                  <button @click="toggleComplete(ct)" class="flex-shrink-0">
                    <div class="size-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300"
                      :class="ct.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200 group-hover/item:border-emerald-400'">
                      <svg v-if="ct.completed" class="size-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  </button>
                  <span class="flex-1 text-sm transition-all" :class="ct.completed ? 'text-gray-300 line-through' : 'text-gray-700'">
                    {{ ct.name }}
                  </span>
                  <span class="text-xs font-mono cursor-pointer hover:text-indigo-500 px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors"
                    :class="ct.custom_hours != null ? 'text-indigo-500 font-medium' : 'text-gray-400'"
                    @click.stop="startEditHours(ct)">
                    {{ getTaskHours(ct) }}h
                    <input v-if="editingHours === ct.id" v-model.number="editHourVal" type="number" step="0.1"
                      class="w-14 text-center border rounded-lg px-1.5 py-1 text-xs outline-none focus:border-indigo-300 absolute"
                      @keydown.enter="saveHours(ct)" @blur="saveHours(ct)" ref="hourInput" />
                  </span>
                  <div class="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0">
                    <button @click="moveChildTask(pt.id, idx, -1)" :disabled="idx === 0"
                      class="p-1 rounded hover:bg-gray-100 disabled:opacity-20"><svg class="size-3 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg></button>
                    <button @click="moveChildTask(pt.id, idx, 1)" :disabled="idx === childTasks[pt.id].length - 1"
                      class="p-1 rounded hover:bg-gray-100 disabled:opacity-20"><svg class="size-3 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></button>
                    <button @click="removeChildTask(ct.id)" class="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400"><svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                  </div>
                </div>
              </div>
              <div v-else class="px-5 py-10 text-center text-gray-300 text-sm">
                暂无子任务 · 点击 + 添加
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- 今日推送 -->
      <div v-if="viewMode === 'daily'" class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-5 border-b border-gray-50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="size-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-lg">📅</div>
              <div>
                <h3 class="font-semibold text-gray-900">今日任务推送</h3>
                <p class="text-xs text-gray-400">{{ new Date().toLocaleDateString('zh-CN', { year:'numeric', month:'long', day:'numeric', weekday:'long' }) }}</p>
              </div>
            </div>
            <div class="text-sm text-gray-400">
              {{ dailyTasks.filter(t => t.completed).length }}/{{ dailyTasks.length }} 完成
            </div>
          </div>
        </div>
        <div class="p-3">
          <div v-if="dailyTasks.length === 0" class="text-center py-16">
            <div class="text-5xl mb-4">🎉</div>
            <p class="text-gray-400 font-medium">全部完成！太棒了</p>
            <p class="text-gray-300 text-sm mt-1">明天继续加油</p>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div v-for="dt in dailyTasks" :key="dt.id"
              @click="doCheckin(dt)"
              class="flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200 hover:bg-indigo-50/50 group border border-transparent hover:border-indigo-100"
              :class="dt.completed ? 'opacity-50' : ''">
              <div class="size-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300"
                :class="dt.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200 group-hover:border-emerald-400 group-hover:bg-emerald-50'">
                <svg v-if="dt.completed" class="size-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm text-gray-800 truncate" :class="dt.completed ? 'line-through' : ''">{{ dt.name }}</div>
                <div class="text-xs text-gray-400 truncate">{{ dt.parent_name }}</div>
              </div>
              <span class="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md flex-shrink-0">{{ getTaskHours(dt) }}h</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 进度统计 -->
      <div v-if="viewMode === 'progress'" class="space-y-4">
        <div v-for="p in progressData" :key="p.parent_id"
          class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-5 flex items-center gap-6">
          <svg class="size-16 flex-shrink-0 -rotate-90">
            <circle cx="32" cy="32" r="26" fill="none" stroke="#f1f5f9" stroke-width="5"/>
            <circle cx="32" cy="32" r="26" fill="none" :stroke="parentColor(p)" stroke-width="5"
              stroke-linecap="round" :stroke-dasharray="163.4"
              :stroke-dashoffset="163.4 - (p.total > 0 ? (p.done / p.total) * 163.4 : 0)"
              class="transition-all duration-700 ease-out"/>
            <text x="32" y="36" text-anchor="middle" fill="#374151" font-size="12" font-weight="bold" transform="rotate(90, 32, 32)">
              {{ p.total > 0 ? Math.round(p.done / p.total * 100) : 0 }}%
            </text>
          </svg>
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900">{{ p.parent_name }}</h3>
            <div class="flex gap-4 mt-2 text-xs text-gray-400">
              <span>{{ p.done }}/{{ p.total }} 子任务</span>
              <span>{{ p.done_hours?.toFixed(1) }}h / {{ p.total_hours?.toFixed(1) }}h</span>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500" :style="{ width: (p.total > 0 ? (p.done / p.total * 100) : 0) + '%', background: parentColor(p) }" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹窗遮罩 -->
    <Transition name="modal">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="closeModal">
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
          <div class="px-6 py-5 border-b border-gray-100">
            <h3 class="font-semibold text-gray-900 text-lg">{{ modalTitle }}</h3>
            <p class="text-xs text-gray-400 mt-0.5">{{ modalDesc }}</p>
          </div>
          <div class="px-6 py-4">
            <input
              ref="modalInput"
              v-model="modalValue"
              :placeholder="modalPlaceholder"
              class="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
              @keydown.enter="confirmModal"
            />
          </div>
          <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3">
            <button @click="closeModal" class="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-200 transition-colors">取消</button>
            <button @click="confirmModal" class="px-5 py-2 rounded-xl text-sm font-medium text-white transition-colors" :style="{ background: currentSubject?.color || '#6366f1' }">确定</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import {
  getStages, createStage, deleteStage, getParentTasks, getChildTasks, createChildTask,
  updateParentTask, deleteParentTask, updateChildTask, deleteChildTask,
  reorderChildTasks, getDailyTasks, checkinTask, uncheckTask, getStudyProgress
} from '../api/index.js'
import { getSubjects as fetchSubjects, createSubject, deleteSubject } from '../api/index.js'

const emit = defineEmits(['toast'])

const subjectIcons = { '数学': '📐', '408': '💻', '英语': '🇬🇧', '政治': '📰' }

const tabs = [
  { key: 'board', label: '任务看板', icon: '📋' },
  { key: 'daily', label: '每日推送', icon: '📅' },
  { key: 'progress', label: '进度统计', icon: '📊' },
]

const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']
function parentColor(pt) {
  if (!pt._color) pt._color = colors[Math.abs(String(pt.name || pt.parent_name || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0)) % colors.length]
  return pt._color
}

const viewMode = ref('board')
const subjects = ref([])
const currentSubject = ref(null)
const stages = ref([])
const currentStages = ref([])
const currentStage = ref(null)
const parentTasks = ref([])
const childTasks = reactive({})
const expandedId = ref(null)
const editingHours = ref(null)
const editHourVal = ref(0)
const hourInput = ref(null)
const dailyTasks = ref([])
const progressData = ref([])

// Modal state
const showModal = ref(false)
const modalTitle = ref('')
const modalDesc = ref('')
const modalValue = ref('')
const modalPlaceholder = ref('')
const modalAction = ref(null) // callback
const modalInput = ref(null)

function openModal(title, desc, placeholder, action) {
  modalTitle.value = title; modalDesc.value = desc; modalPlaceholder.value = placeholder
  modalValue.value = ''; modalAction.value = action; showModal.value = true
  setTimeout(() => modalInput.value?.focus(), 100)
}
function closeModal() { showModal.value = false; modalAction.value = null }
function confirmModal() {
  if (modalAction.value && modalValue.value.trim()) {
    modalAction.value(modalValue.value.trim())
  }
  closeModal()
}

const totalTasks = computed(() => {
  let n = 0; Object.values(childTasks).forEach(arr => { if (Array.isArray(arr)) n += arr.length }); return n
})
const completedTasks = computed(() => {
  let n = 0; Object.values(childTasks).forEach(arr => { if (Array.isArray(arr)) n += arr.filter(c => c.completed).length }); return n
})
const totalHours = computed(() => {
  let h = 0; Object.values(childTasks).forEach(arr => { if (Array.isArray(arr)) arr.forEach(c => h += getTaskHours(c)) }); return h
})

const statCards = computed(() => [
  { label: '父任务', value: parentTasks.value.length, icon: '📚', bg: '#eef2ff', sub: `${parentTasks.value.filter(p => p.active).length} 本在用`, trend: 1 },
  { label: '子任务', value: totalTasks.value, icon: '📝', bg: '#fdf2f8', sub: `${completedTasks.value} 个已攻克`, trend: 1 },
  { label: '总时长', value: totalHours.value.toFixed(1) + 'h', icon: '⏱️', bg: '#f0fdf4', sub: '规划学习总量', trend: 0 },
  { label: '完成率', value: (totalTasks.value > 0 ? Math.round(completedTasks.value / totalTasks.value * 100) : 0) + '%', icon: '🎯', bg: '#fffbeb', sub: '距离上岸更进一步', trend: 1 },
])

async function loadSubjects() {
  try {
    const res = await fetchSubjects()
    subjects.value = res.data.data
    if (subjects.value.length > 0 && !currentSubject.value) {
      selectSubject(subjects.value[0])
    }
  } catch { /* */ }
}

async function selectSubject(subj) {
  currentSubject.value = subj
  currentStage.value = null
  parentTasks.value = []
  Object.keys(childTasks).forEach(k => delete childTasks[k])
  expandedId.value = null
  try {
    const res = await getStages(subj.id)
    currentStages.value = res.data.data
    if (currentStages.value.length > 0) selectStage(currentStages.value[0])
  } catch { /* */ }
}

async function selectStage(st) {
  currentStage.value = st
  expandedId.value = null
  Object.keys(childTasks).forEach(k => delete childTasks[k])
  try { const res = await getParentTasks(st.id); parentTasks.value = res.data.data } catch { /* */ }
}

async function addSubject() {
  openModal('新增科目', '输入科目名称', '例如：数学、408、英语、政治', async (name) => {
    try { await createSubject({ name }); await loadSubjects() } catch { emit('toast', '创建失败') }
  })
}

async function removeSubject(subj) {
  if (!confirm(`确定删除科目「${subj.name}」及其所有阶段和任务？`)) return
  try {
    await deleteSubject(subj.id)
    if (currentSubject.value?.id === subj.id) {
      currentSubject.value = null; currentStages.value = []; currentStage.value = null; parentTasks.value = []
    }
    await loadSubjects()
  } catch { emit('toast', '删除失败') }
}

async function addStage() {
  if (!currentSubject.value) return
  openModal('新增阶段', `为「${currentSubject.value.name}」添加阶段`, '例如：高数基础、真题阶段', async (name) => {
    try {
      await createStage({ subject_id: currentSubject.value.id, name })
      const res = await getStages(currentSubject.value.id)
      currentStages.value = res.data.data
    } catch { emit('toast', '创建失败') }
  })
}

async function removeStage(st) {
  if (!confirm(`确定删除阶段「${st.name}」及其所有任务？`)) return
  try {
    await deleteStage(st.id)
    if (currentStage.value?.id === st.id) {
      currentStage.value = null; parentTasks.value = []
      Object.keys(childTasks).forEach(k => delete childTasks[k])
    }
    const res = await getStages(currentSubject.value.id)
    currentStages.value = res.data.data
    if (currentStages.value.length > 0 && !currentStage.value) selectStage(currentStages.value[0])
  } catch { emit('toast', '删除失败') }
}

async function addChildTask(pt) {
  openModal('新增子任务', `添加到「${pt.name}」`, '子任务名称', async (name) => {
    try {
      await createChildTask({ parent_task_id: pt.id, name })
      if (childTasks[pt.id]) {
        const res = await getChildTasks(pt.id); childTasks[pt.id] = res.data.data
      } else {
        openParent(pt)
      }
    } catch { /* */ }
  })
}

async function openParent(pt) {
  expandedId.value = expandedId.value === pt.id ? null : pt.id
  if (expandedId.value && !childTasks[pt.id]) {
    try { const res = await getChildTasks(pt.id); childTasks[pt.id] = res.data.data } catch { /* */ }
  }
}

function getDoneCount(pid) { const c = childTasks[pid]; return c ? c.filter(t => t.completed).length : 0 }
function getTotalCount(pid) { return childTasks[pid]?.length || 0 }
function getParentProgress(pid) { const c = childTasks[pid]; return c && c.length ? Math.round(c.filter(t => t.completed).length / c.length * 100) : 0 }
function activeTasksFor(pid) { const c = childTasks[pid]; return c ? c.filter(t => !t.completed).length : 0 }
function getTaskHours(ct) { return ct.custom_hours != null ? ct.custom_hours : ct.default_hours }

async function toggleActive(pt) {
  try { await updateParentTask(pt.id, { active: !pt.active }); pt.active = !pt.active } catch { /* */ }
}
async function removeParentTask(id) {
  try { await deleteParentTask(id); parentTasks.value = parentTasks.value.filter(p => p.id !== id); delete childTasks[id]; expandedId.value = null } catch { emit('toast', '删除失败') }
}
async function toggleComplete(ct) {
  try {
    if (ct.completed) { await uncheckTask(ct.id); ct.completed = false; ct.actual_hours = 0; ct.study_date = null }
    else { const h = getTaskHours(ct); await checkinTask(ct.id, h); ct.completed = true; ct.actual_hours = h }
  } catch { /* */ }
}
async function startEditHours(ct) {
  editingHours.value = ct.id; editHourVal.value = getTaskHours(ct)
  await nextTick(); hourInput.value?.focus?.(); hourInput.value?.select?.()
}
async function saveHours(ct) {
  await updateChildTask(ct.id, { custom_hours: editHourVal.value }); ct.custom_hours = editHourVal.value; editingHours.value = null
}
async function moveChildTask(pid, idx, dir) {
  const arr = childTasks[pid]; if (!arr) return
  const ni = idx + dir; if (ni < 0 || ni >= arr.length) return
  arr.splice(ni, 0, arr.splice(idx, 1)[0]); await reorderChildTasks(arr.map(c => c.id))
}
async function removeChildTask(id) {
  await deleteChildTask(id); Object.keys(childTasks).forEach(k => { childTasks[k] = childTasks[k]?.filter(c => c.id !== id) })
}
async function loadDaily() {
  try { const res = await getDailyTasks(); dailyTasks.value = res.data.data.tasks } catch { /* */ }
}
async function doCheckin(dt) {
  if (dt.completed) { await uncheckTask(dt.id); dt.completed = false }
  else { await checkinTask(dt.id, getTaskHours(dt)); dt.completed = true }
}
async function loadProgress() {
  if (!currentStage.value) return
  try { const res = await getStudyProgress(currentStage.value.id); progressData.value = res.data.data } catch { /* */ }
}

watch(viewMode, v => { if (v === 'daily') loadDaily(); if (v === 'progress') loadProgress() })
onMounted(loadSubjects)
</script>

<style scoped>
.expand-enter-active, .expand-leave-active { transition: all 0.3s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { max-height: 2000px; }

.modal-enter-active { transition: all 0.25s ease; }
.modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from { opacity: 0; }
.modal-enter-from > div:last-child { transform: scale(0.95) translateY(10px); }
.modal-leave-to { opacity: 0; }
.modal-leave-to > div:last-child { transform: scale(0.95) translateY(10px); }
</style>
