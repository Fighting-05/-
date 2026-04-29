<template>
  <div class="app-shell" @mousemove="onMouseMove" @click="onClick">
    <!-- ====== Canvas 粒子背景 ====== -->
    <canvas ref="canvas" class="particle-canvas" />

    <!-- ====== 极光层 ====== -->
    <div class="aurora aurora-1" :style="auroraStyle1" />
    <div class="aurora aurora-2" :style="auroraStyle2" />

    <!-- ====== 主内容 ====== -->
    <div class="content" ref="contentRef" :style="parallaxStyle">
      <!-- 头部 -->
      <header class="header" ref="headerRef" data-parallax="0.3">
        <div class="header-text">
          <p class="eyebrow stagger-in">考研任务管理</p>
          <h1 class="title stagger-in">{{ currentStage ? currentStage.name : '选择阶段' }}</h1>
          <div class="stats-row stagger-in">
            <span class="stat"><span class="stat-num">{{ totalTasks }}</span> 子任务</span>
            <span class="stat"><span class="stat-num">{{ completedTasks }}</span> 已完成</span>
            <span class="stat"><span class="stat-num">{{ totalHours.toFixed(1) }}h</span> 总时长</span>
          </div>
        </div>
        <div class="header-ring" ref="ringRef" data-parallax="0.6">
          <svg class="ring-svg" viewBox="0 0 160 160">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <circle cx="80" cy="80" r="64" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="6"/>
            <circle cx="80" cy="80" r="64" fill="none" :stroke="ringColor" stroke-width="6"
              stroke-linecap="round" filter="url(#glow)"
              :stroke-dasharray="402" :stroke-dashoffset="402 - (totalTasks > 0 ? (completedTasks / totalTasks) * 402 : 0)"
              class="ring-fill" />
          </svg>
          <div class="ring-center">
            <span class="ring-pct">{{ totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0 }}%</span>
            <span class="ring-label">完成率</span>
          </div>
        </div>
        <div class="header-glow" :style="headerGlowStyle" />
      </header>

      <!-- 导航 -->
      <nav class="nav stagger-in">
        <div class="nav-tabs">
          <button v-for="tab in tabs" :key="tab.key" @click="viewMode = tab.key"
            class="nav-tab" :class="{ active: viewMode === tab.key }">
            {{ tab.icon }} {{ tab.label }}
          </button>
        </div>
        <div class="nav-divider" />
      </nav>

      <!-- 统计卡片 -->
      <div class="stat-cards stagger-in" ref="cardsRef">
        <div v-for="(card, i) in statCards" :key="card.label" class="stat-card glass-card"
          :data-parallax="String(0.4 + i * 0.08)"
          :style="{ transitionDelay: i * 0.05 + 's' }">
          <div class="card-glow-border" />
          <div class="card-icon" :style="{ background: card.bg }">{{ card.icon }}</div>
          <div class="card-value">{{ card.value }}</div>
          <div class="card-label">{{ card.label }}</div>
          <div class="card-sub">{{ card.sub }}</div>
        </div>
      </div>

      <!-- 科目选择 -->
      <div class="subject-pills stagger-in">
        <button v-for="subj in subjects" :key="subj.id" @click="selectSubject(subj)"
          class="subject-pill group" :class="{ active: currentSubject?.id === subj.id }"
          :style="currentSubject?.id === subj.id ? { '--pill-color': subj.color } : {}">
          <span class="pill-bounce">{{ subjectIcons[subj.name] || '📖' }}</span>
          {{ subj.name }}
          <button v-if="subjects.length > 1" @click.stop="removeSubject(subj)" class="pill-close"><svg class="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </button>
        <button @click="addSubject" class="subject-pill add-pill">+</button>
      </div>

      <!-- 阶段选择 -->
      <div v-if="currentSubject" class="stage-pills stagger-in">
        <button v-for="st in currentStages" :key="st.id" @click="selectStage(st)"
          class="stage-pill group" :class="{ active: currentStage?.id === st.id }"
          :style="currentStage?.id === st.id ? { '--pill-color': currentSubject.color } : {}">
          {{ st.name }}
          <button v-if="currentStages.length > 1" @click.stop="removeStage(st)" class="pill-close"><svg class="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </button>
        <button @click="addStage" class="stage-pill add-pill">+ 添加阶段</button>
      </div>

      <!-- 看板 -->
      <div v-if="viewMode === 'board'" class="board">
        <div v-for="(pt, i) in parentTasks" :key="pt.id" class="task-card glass-card"
          :class="{ expanded: expandedId === pt.id, dimmed: !pt.active }"
          :style="{ transitionDelay: i * 0.04 + 's' }"
          @click="expandedId === pt.id ? (expandedId = null) : openParent(pt)">
          <div class="card-glow-border" />
          <div class="task-card-header">
            <div class="task-icon" :style="{ background: parentColor(pt) }">{{ pt.name.charAt(0) }}</div>
            <div class="task-info">
              <span class="task-name">{{ pt.name }}</span>
              <span class="task-meta">{{ activeTasksFor(pt.id) }} 待完成</span>
            </div>
            <div class="task-actions" @click.stop>
              <button @click="toggleActive(pt)" class="task-btn" :title="pt.active ? '隐藏' : '显示'">
                <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button @click="addChildTask(pt)" class="task-btn">
                <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
          </div>
          <div class="task-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: getParentProgress(pt.id) + '%', background: parentColor(pt) }" />
            </div>
            <span class="progress-text">{{ getDoneCount(pt.id) }}/{{ getTotalCount(pt.id) }} · {{ getParentProgress(pt.id) }}%</span>
          </div>

          <!-- 子任务 -->
          <Transition name="expand">
            <div v-if="expandedId === pt.id" class="subtasks" @click.stop>
              <div v-if="childTasks[pt.id]?.length">
                <div v-for="(ct, idx) in childTasks[pt.id]" :key="ct.id" class="subtask-row">
                  <button @click="toggleComplete(ct)" class="subtask-check" :class="{ done: ct.completed }">
                    <svg v-if="ct.completed" class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </button>
                  <span class="subtask-name" :class="{ done: ct.completed }">{{ ct.name }}</span>
                  <span class="subtask-hours" @click.stop="startEditHours(ct)" :class="{ custom: ct.custom_hours != null }">
                    <input v-if="editingHours === ct.id" v-model.number="editHourVal" type="number" step="0.1" class="hours-input" @keydown.enter="saveHours(ct)" @blur="saveHours(ct)" ref="hourInput" />
                    <template v-else>{{ getTaskHours(ct) }}h</template>
                  </span>
                  <div class="subtask-btns">
                    <button @click="moveChildTask(pt.id, idx, -1)" :disabled="idx === 0">↑</button>
                    <button @click="moveChildTask(pt.id, idx, 1)" :disabled="idx === childTasks[pt.id].length - 1">↓</button>
                    <button @click="removeChildTask(ct.id)" class="del">×</button>
                  </div>
                </div>
              </div>
              <div v-else class="subtask-empty">暂无子任务 · 点击 + 添加</div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- 今日 -->
      <div v-if="viewMode === 'daily'" class="daily-view">
        <div class="glass-card daily-card">
          <div class="card-glow-border" />
          <div class="daily-header">
            <div class="daily-cal">
              <span class="cal-day">{{ new Date().getDate() }}</span>
              <span class="cal-month">{{ new Date().toLocaleDateString('zh-CN', { month:'short' }) }}</span>
            </div>
            <div>
              <h3 class="daily-title">今日推送</h3>
              <p class="daily-date">{{ new Date().toLocaleDateString('zh-CN', { weekday:'long', month:'long', day:'numeric' }) }}</p>
            </div>
            <span class="daily-count">{{ dailyTasks.filter(t => t.completed).length }}/{{ dailyTasks.length }}</span>
          </div>
          <div v-if="dailyTasks.length === 0" class="daily-empty">🎉 全部完成！太棒了</div>
          <div v-else class="daily-grid">
            <div v-for="dt in dailyTasks" :key="dt.id" @click="doCheckin(dt)" class="daily-item" :class="{ done: dt.completed }">
              <div class="daily-check" :class="{ done: dt.completed }">
                <svg v-if="dt.completed" class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div class="daily-info">
                <span class="daily-name" :class="{ done: dt.completed }">{{ dt.name }}</span>
                <span class="daily-parent">{{ dt.parent_name }}</span>
              </div>
              <span class="daily-hours">{{ getTaskHours(dt) }}h</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 进度 -->
      <div v-if="viewMode === 'progress'" class="progress-view">
        <div v-for="p in progressData" :key="p.parent_id" class="glass-card progress-card">
          <div class="card-glow-border" />
          <svg class="progress-ring" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="5"/>
            <circle cx="40" cy="40" r="30" fill="none" :stroke="parentColor(p)" stroke-width="5" stroke-linecap="round" filter="url(#glow)"
              :stroke-dasharray="188.5" :stroke-dashoffset="188.5 - (p.total > 0 ? (p.done / p.total) * 188.5 : 0)" />
            <text x="40" y="36" text-anchor="middle" fill="white" font-size="11" font-weight="bold">{{ p.total > 0 ? Math.round(p.done / p.total * 100) : 0 }}%</text>
            <text x="40" y="50" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="8">完成</text>
          </svg>
          <div class="progress-info">
            <span class="progress-name">{{ p.parent_name }}</span>
            <div class="progress-bar-sm"><div class="progress-bar-sm-fill" :style="{ width: (p.total > 0 ? (p.done / p.total * 100) : 0) + '%', background: parentColor(p) }" /></div>
            <span class="progress-meta">{{ p.done }}/{{ p.total }} 子任务 · {{ p.done_hours?.toFixed(1) }}h</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹窗 -->
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card">
          <h3 class="modal-title">{{ modalTitle }}</h3>
          <p class="modal-desc">{{ modalDesc }}</p>
          <input ref="modalInput" v-model="modalValue" :placeholder="modalPlaceholder" class="modal-input" @keydown.enter="confirmModal" />
          <div class="modal-btns">
            <button @click="closeModal" class="modal-cancel">取消</button>
            <button @click="confirmModal" class="modal-ok">确定</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
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
  { key: 'daily', label: '今日推送', icon: '📅' },
  { key: 'progress', label: '进度', icon: '📊' },
]
const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']
function parentColor(pt) {
  if (!pt._color) pt._color = colors[Math.abs(String(pt.name || pt.parent_name || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0)) % colors.length]
  return pt._color
}

/* ====== Canvas 粒子系统 ====== */
const canvas = ref(null)
const mouse = reactive({ x: 0, y: 0, tx: 0, ty: 0 })
const clickPos = reactive({ x: 0, y: 0, active: false })
let particles = []; let raf = null; let ctx = null

function initParticles() {
  if (!canvas.value) return
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight
  ctx = canvas.value.getContext('2d')
  particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.value.width,
    y: Math.random() * canvas.value.height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    r: Math.random() * 1.5 + 0.5,
    baseR: 0,
    alpha: Math.random() * 0.5 + 0.15,
    hue: [250, 270, 290][Math.floor(Math.random() * 3)],
  }))
  particles.forEach(p => { p.baseR = p.r })
}

function animateParticles() {
  if (!ctx || !canvas.value) return
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  // 鼠标平滑
  mouse.tx += (mouse.x - mouse.tx) * 0.08
  mouse.ty += (mouse.y - mouse.ty) * 0.08

  // 点击波纹扩散
  if (clickPos.active) clickPos.active = false

  for (const p of particles) {
    const dx = mouse.tx - p.x, dy = mouse.ty - p.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    // 排斥
    if (dist < 120) {
      const force = (1 - dist / 120) * 2
      p.vx -= (dx / dist) * force * 0.1
      p.vy -= (dy / dist) * force * 0.1
      p.r = p.baseR + force * 2
    } else {
      p.r += (p.baseR - p.r) * 0.1
    }
    // 点击冲击波
    if (clickPos.active) {
      const cdx = clickPos.x - p.x, cdy = clickPos.y - p.y
      const cd = Math.sqrt(cdx * cdx + cdy * cdy)
      if (cd < 150) {
        p.vx += (cdx / cd) * (1 - cd / 150) * 3
        p.vy += (cdy / cd) * (1 - cd / 150) * 3
      }
    }
    // 阻尼
    p.vx *= 0.99; p.vy *= 0.99
    p.x += p.vx; p.y += p.vy
    if (p.x < 0) p.x = canvas.value.width
    if (p.x > canvas.value.width) p.x = 0
    if (p.y < 0) p.y = canvas.value.height
    if (p.y > canvas.value.height) p.y = 0

    // 连线
    for (const q of particles) {
      if (p === q) continue
      const d = Math.hypot(p.x - q.x, p.y - q.y)
      if (d < 80) {
        ctx.beginPath()
        ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y)
        ctx.strokeStyle = `hsla(${p.hue}, 60%, 60%, ${(1 - d / 80) * 0.06})`
        ctx.stroke()
      }
    }
  }

  for (const p of particles) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${p.hue}, 70%, 65%, ${p.alpha})`
    ctx.shadowColor = `hsl(${p.hue}, 70%, 60%)`
    ctx.shadowBlur = p.r * 3
    ctx.fill()
    ctx.shadowBlur = 0
  }

  raf = requestAnimationFrame(animateParticles)
}

function onMouseMove(e) {
  mouse.x = e.clientX; mouse.y = e.clientY
}
function onClick(e) {
  clickPos.x = e.clientX; clickPos.y = e.clientY; clickPos.active = true
}

/* ====== 视差 ====== */
const parallaxStyle = computed(() => ({
  transform: `translate(${(mouse.x - window.innerWidth / 2) * 0.008}px, ${(mouse.y - window.innerHeight / 2) * 0.008}px)`,
}))

const auroraStyle1 = computed(() => ({
  transform: `translate(${(mouse.x - window.innerWidth / 2) * 0.015}px, ${(mouse.y - window.innerHeight / 2) * 0.015}px)`,
}))
const auroraStyle2 = computed(() => ({
  transform: `translate(${-(mouse.x - window.innerWidth / 2) * 0.01}px, ${-(mouse.y - window.innerHeight / 2) * 0.01}px)`,
}))

const headerGlowStyle = computed(() => ({
  left: mouse.x * 0.05 + '%',
  top: mouse.y * 0.03 + '%',
}))

const ringColor = computed(() => {
  const pct = totalTasks.value > 0 ? completedTasks.value / totalTasks.value : 0
  const r = Math.round(99 + pct * 156)
  const g = Math.round(102 + pct * 99)
  const b = Math.round(241 - pct * 61)
  return `rgb(${r}, ${g}, ${b})`
})

/* ====== 状态 ====== */
const viewMode = ref('board')
const subjects = ref([])
const currentSubject = ref(null)
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
const showModal = ref(false)
const modalTitle = ref(''); const modalDesc = ref(''); const modalValue = ref(''); const modalPlaceholder = ref('')
let modalAction = null
const modalInput = ref(null)

const totalTasks = computed(() => { let n = 0; Object.values(childTasks).forEach(arr => { if (Array.isArray(arr)) n += arr.length }); return n })
const completedTasks = computed(() => { let n = 0; Object.values(childTasks).forEach(arr => { if (Array.isArray(arr)) n += arr.filter(c => c.completed).length }); return n })
const totalHours = computed(() => { let h = 0; Object.values(childTasks).forEach(arr => { if (Array.isArray(arr)) arr.forEach(c => h += getTaskHours(c)) }); return h })
const statCards = computed(() => [
  { label: '父任务', value: parentTasks.value.length, icon: '📚', bg: 'rgba(99,102,241,0.15)', sub: `${parentTasks.value.filter(p => p.active).length} 本在用` },
  { label: '子任务', value: totalTasks.value, icon: '📝', bg: 'rgba(236,72,153,0.15)', sub: `${completedTasks.value} 个已攻克` },
  { label: '总时长', value: totalHours.value.toFixed(1) + 'h', icon: '⏱️', bg: 'rgba(16,185,129,0.15)', sub: '规划学习总量' },
  { label: '完成率', value: (totalTasks.value > 0 ? Math.round(completedTasks.value / totalTasks.value * 100) : 0) + '%', icon: '🎯', bg: 'rgba(245,158,11,0.15)', sub: '继续加油' },
])

function getTaskHours(ct) { return ct.custom_hours != null ? ct.custom_hours : ct.default_hours }
function getDoneCount(pid) { const c = childTasks[pid]; return c ? c.filter(t => t.completed).length : 0 }
function getTotalCount(pid) { return childTasks[pid]?.length || 0 }
function getParentProgress(pid) { const c = childTasks[pid]; return c && c.length ? Math.round(c.filter(t => t.completed).length / c.length * 100) : 0 }
function activeTasksFor(pid) { const c = childTasks[pid]; return c ? c.filter(t => !t.completed).length : 0 }

function openModal(title, desc, placeholder, action) {
  modalTitle.value = title; modalDesc.value = desc; modalPlaceholder.value = placeholder
  modalValue.value = ''; modalAction = action; showModal.value = true
  setTimeout(() => modalInput.value?.focus(), 100)
}
function closeModal() { showModal.value = false; modalAction = null }
function confirmModal() {
  if (modalAction && modalValue.value.trim()) modalAction(modalValue.value.trim())
  closeModal()
}

/* ====== 数据加载 ====== */
async function loadSubjects() {
  try {
    const res = await fetchSubjects(); subjects.value = res.data.data
    if (subjects.value.length > 0 && !currentSubject.value) selectSubject(subjects.value[0])
  } catch { /* */ }
}
async function selectSubject(subj) {
  currentSubject.value = subj; currentStage.value = null; parentTasks.value = []; expandedId.value = null
  Object.keys(childTasks).forEach(k => delete childTasks[k])
  try { const res = await getStages(subj.id); currentStages.value = res.data.data; if (currentStages.value.length > 0) selectStage(currentStages.value[0]) } catch { /* */ }
}
async function selectStage(st) {
  currentStage.value = st; expandedId.value = null
  Object.keys(childTasks).forEach(k => delete childTasks[k])
  try { const res = await getParentTasks(st.id); parentTasks.value = res.data.data } catch { /* */ }
}
async function openParent(pt) {
  expandedId.value = expandedId.value === pt.id ? null : pt.id
  if (expandedId.value && !childTasks[pt.id]) {
    try { const res = await getChildTasks(pt.id); childTasks[pt.id] = res.data.data } catch { /* */ }
  }
}

/* ====== 增删改 ====== */
async function addSubject() { openModal('新增科目', '输入科目名称', '数学、408、英语、政治', async (name) => { try { await createSubject({ name }); await loadSubjects() } catch { emit('toast', '创建失败') } }) }
async function removeSubject(subj) { if (!confirm(`删除「${subj.name}」及其所有数据？`)) return; try { await deleteSubject(subj.id); if (currentSubject.value?.id === subj.id) { currentSubject.value = null; currentStages.value = []; currentStage.value = null; parentTasks.value = [] } await loadSubjects() } catch { } }
async function addStage() { if (!currentSubject.value) return; openModal('新增阶段', `为「${currentSubject.value.name}」添加`, '高数基础、真题阶段', async (name) => { try { await createStage({ subject_id: currentSubject.value.id, name }); const res = await getStages(currentSubject.value.id); currentStages.value = res.data.data } catch { } }) }
async function removeStage(st) { if (!confirm(`删除「${st.name}」？`)) return; try { await deleteStage(st.id); if (currentStage.value?.id === st.id) { currentStage.value = null; parentTasks.value = []; Object.keys(childTasks).forEach(k => delete childTasks[k]) }; const res = await getStages(currentSubject.value.id); currentStages.value = res.data.data; if (currentStages.value.length > 0 && !currentStage.value) selectStage(currentStages.value[0]) } catch { } }
async function addChildTask(pt) { openModal('新增子任务', `添加到「${pt.name}」`, '子任务名称', async (name) => { try { await createChildTask({ parent_task_id: pt.id, name }); if (childTasks[pt.id]) { const res = await getChildTasks(pt.id); childTasks[pt.id] = res.data.data } else openParent(pt) } catch { } }) }
async function toggleActive(pt) { try { await updateParentTask(pt.id, { active: !pt.active }); pt.active = !pt.active } catch { } }
async function removeParentTask(id) { try { await deleteParentTask(id); parentTasks.value = parentTasks.value.filter(p => p.id !== id); delete childTasks[id]; expandedId.value = null } catch { } }
async function toggleComplete(ct) { try { if (ct.completed) { await uncheckTask(ct.id); ct.completed = false; ct.actual_hours = 0; ct.study_date = null } else { const h = getTaskHours(ct); await checkinTask(ct.id, h); ct.completed = true; ct.actual_hours = h } } catch { } }
async function startEditHours(ct) { editingHours.value = ct.id; editHourVal.value = getTaskHours(ct); await nextTick(); hourInput.value?.focus?.(); hourInput.value?.select?.() }
async function saveHours(ct) { await updateChildTask(ct.id, { custom_hours: editHourVal.value }); ct.custom_hours = editHourVal.value; editingHours.value = null }
async function moveChildTask(pid, idx, dir) { const arr = childTasks[pid]; if (!arr) return; const ni = idx + dir; if (ni < 0 || ni >= arr.length) return; arr.splice(ni, 0, arr.splice(idx, 1)[0]); await reorderChildTasks(arr.map(c => c.id)) }
async function removeChildTask(id) { await deleteChildTask(id); Object.keys(childTasks).forEach(k => { childTasks[k] = childTasks[k]?.filter(c => c.id !== id) }) }
async function loadDaily() { try { const res = await getDailyTasks(); dailyTasks.value = res.data.data.tasks } catch { } }
async function doCheckin(dt) { if (dt.completed) { await uncheckTask(dt.id); dt.completed = false } else { await checkinTask(dt.id, getTaskHours(dt)); dt.completed = true } }
async function loadProgress() { if (!currentStage.value) return; try { const res = await getStudyProgress(currentStage.value.id); progressData.value = res.data.data } catch { } }

watch(viewMode, v => { if (v === 'daily') loadDaily(); if (v === 'progress') loadProgress() })

onMounted(() => {
  loadSubjects()
  initParticles()
  raf = requestAnimationFrame(animateParticles)
  window.addEventListener('resize', initParticles)
})
onUnmounted(() => { if (raf) cancelAnimationFrame(raf); window.removeEventListener('resize', initParticles) })
</script>

<style scoped>
/* ====== 全局重置 ====== */
.app-shell {
  min-height: 100vh;
  background: #0D0D12;
  color: #e0e0e8;
  position: relative;
  overflow-x: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
}

/* ====== Canvas ====== */
.particle-canvas {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
}

/* ====== 极光 ====== */
.aurora {
  position: fixed; border-radius: 50%; filter: blur(120px); opacity: 0.12; pointer-events: none; z-index: 0;
}
.aurora-1 { width: 600px; height: 400px; top: -10%; left: -5%; background: radial-gradient(ellipse, #6366f1, transparent 70%); }
.aurora-2 { width: 500px; height: 350px; bottom: -15%; right: -5%; background: radial-gradient(ellipse, #8b5cf6, transparent 70%); }

/* ====== 内容 ====== */
.content {
  position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; padding: 48px 32px 80px;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ====== 头部 ====== */
.header {
  display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;
  position: relative; padding: 36px 40px; border-radius: 24px;
  background: rgba(255,255,255,0.02); backdrop-filter: blur(30px);
  border: 1px solid rgba(255,255,255,0.05); overflow: hidden;
}
.header-glow {
  position: absolute; width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%);
  border-radius: 50%; pointer-events: none; transition: left 0.8s ease, top 0.8s ease;
}
.eyebrow { font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: rgba(255,255,255,0.25); margin-bottom: 6px; }
.title { font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #fff; }
.stats-row { display: flex; gap: 20px; margin-top: 12px; }
.stat { font-size: 13px; color: rgba(255,255,255,0.35); }
.stat-num { color: rgba(255,255,255,0.7); font-weight: 600; margin-right: 2px; }

/* 环形进度 */
.header-ring { position: relative; flex-shrink: 0; }
.ring-svg { width: 140px; height: 140px; display: block; }
.ring-fill { transition: stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1); }
.ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.ring-pct { font-size: 28px; font-weight: 700; color: #fff; }
.ring-label { font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 2px; }

/* ====== 导航 ====== */
.nav { display: flex; align-items: center; margin-bottom: 28px; }
.nav-tabs { display: flex; gap: 2px; background: rgba(255,255,255,0.03); border-radius: 14px; padding: 4px; border: 1px solid rgba(255,255,255,0.04); }
.nav-tab { padding: 8px 20px; border-radius: 10px; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.35); border: none; background: none; cursor: pointer; transition: all 0.25s; }
.nav-tab.active { background: rgba(99,102,241,0.2); color: #a5b4fc; }
.nav-tab:hover:not(.active) { color: rgba(255,255,255,0.6); }
.nav-divider { flex: 1; height: 1px; background: rgba(255,255,255,0.04); margin-left: 20px; }

/* ====== 玻璃卡片 ====== */
.glass-card {
  background: rgba(255,255,255,0.015); backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.04); border-radius: 18px;
  position: relative; overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.glass-card:hover { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.08); transform: translateY(-2px); }
.card-glow-border {
  position: absolute; inset: 0; border-radius: 18px; padding: 1px;
  background: linear-gradient(135deg, rgba(99,102,241,0.15), transparent 40%, transparent 60%, rgba(139,92,246,0.1));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  pointer-events: none; opacity: 0; transition: opacity 0.5s;
}
.glass-card:hover .card-glow-border { opacity: 1; }

/* 统计卡片 */
.stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
.stat-card { padding: 20px; }
.card-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; margin-bottom: 12px; }
.card-value { font-size: 24px; font-weight: 700; color: #fff; }
.card-label { font-size: 11px; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
.card-sub { font-size: 11px; color: rgba(255,255,255,0.2); margin-top: 2px; }

/* ====== 科目/阶段标签 ====== */
.subject-pills, .stage-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.subject-pill, .stage-pill {
  display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 12px;
  font-size: 13px; font-weight: 500; border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.4);
  cursor: pointer; transition: all 0.25s; position: relative;
}
.subject-pill:hover, .stage-pill:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); }
.subject-pill.active, .stage-pill.active {
  background: var(--pill-color, #6366f1); border-color: var(--pill-color, #6366f1); color: #fff;
}
.subject-pill:active .pill-bounce, .stage-pill:active { animation: jelly 0.4s ease; }
@keyframes jelly {
  0%,100% { transform: scale(1); }
  30% { transform: scale(0.9); }
  60% { transform: scale(1.05); }
}
.add-pill { border-style: dashed; color: rgba(255,255,255,0.2); }
.add-pill:hover { color: rgba(255,255,255,0.4); border-color: rgba(255,255,255,0.15); }
.pill-close {
  position: absolute; top: -6px; right: -6px; width: 16px; height: 16px;
  border-radius: 50%; background: #ef4444; color: #fff; display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s; border: none; cursor: pointer;
}
.subject-pill:hover .pill-close, .stage-pill:hover .pill-close { opacity: 1; }

/* ====== 任务卡片 ====== */
.board { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.task-card { padding: 20px; cursor: pointer; }
.task-card.expanded { border-color: rgba(99,102,241,0.2); }
.task-card.dimmed { opacity: 0.4; }
.task-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.task-icon {
  width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 16px; color: #fff; flex-shrink: 0;
}
.task-info { flex: 1; min-width: 0; }
.task-name { font-size: 14px; font-weight: 600; color: #e0e0e8; display: block; }
.task-meta { font-size: 11px; color: rgba(255,255,255,0.25); margin-top: 2px; }
.task-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; }
.task-card:hover .task-actions { opacity: 1; }
.task-btn {
  padding: 6px; border-radius: 8px; border: none; background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.3); cursor: pointer; transition: all 0.2s;
}
.task-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); }
.task-progress { display: flex; align-items: center; gap: 10px; }
.progress-bar { flex: 1; height: 4px; background: rgba(255,255,255,0.04); border-radius: 2px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 2px; transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.progress-text { font-size: 11px; color: rgba(255,255,255,0.25); white-space: nowrap; }

/* 子任务 */
.subtasks { margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 12px; max-height: 360px; overflow-y: auto; }
.subtask-row { display: flex; align-items: center; gap: 10px; padding: 8px 4px; border-radius: 8px; transition: background 0.2s; }
.subtask-row:hover { background: rgba(255,255,255,0.02); }
.subtask-check {
  width: 20px; height: 20px; border-radius: 6px; border: 2px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;
  background: none; cursor: pointer; transition: all 0.3s; color: transparent; flex-shrink: 0;
}
.subtask-check.done { background: #10b981; border-color: #10b981; color: #fff; }
.subtask-check:hover { border-color: rgba(16,185,129,0.5); }
.subtask-name { flex: 1; font-size: 13px; color: rgba(255,255,255,0.7); transition: all 0.3s; }
.subtask-name.done { color: rgba(255,255,255,0.15); text-decoration: line-through; }
.subtask-hours { font-size: 11px; color: rgba(255,255,255,0.25); cursor: pointer; padding: 2px 6px; border-radius: 4px; transition: all 0.2s; position: relative; }
.subtask-hours:hover { background: rgba(255,255,255,0.04); }
.subtask-hours.custom { color: #a5b4fc; }
.hours-input { width: 50px; background: rgba(255,255,255,0.06); border: 1px solid rgba(99,102,241,0.3); border-radius: 6px; padding: 2px 6px; color: #fff; font-size: 11px; text-align: center; outline: none; position: absolute; right: 0; top: -4px; }
.subtask-btns { display: flex; gap: 2px; opacity: 0; transition: opacity 0.2s; }
.subtask-row:hover .subtask-btns { opacity: 1; }
.subtask-btns button { width: 22px; height: 22px; border-radius: 4px; border: none; background: none; color: rgba(255,255,255,0.2); cursor: pointer; font-size: 11px; transition: all 0.2s; }
.subtask-btns button:hover:not(:disabled) { color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.04); }
.subtask-btns button:disabled { opacity: 0.2; }
.subtask-btns .del:hover { color: #ef4444; }
.subtask-empty { text-align: center; padding: 24px; color: rgba(255,255,255,0.15); font-size: 13px; }

/* ====== 今日推送 ====== */
.daily-card { padding: 24px; }
.daily-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
.daily-cal { width: 48px; height: 48px; border-radius: 12px; background: rgba(99,102,241,0.1); display: flex; flex-direction: column; align-items: center; justify-content: center; }
.cal-day { font-size: 18px; font-weight: 700; color: #a5b4fc; }
.cal-month { font-size: 10px; color: rgba(255,255,255,0.3); }
.daily-title { font-size: 16px; font-weight: 600; color: #fff; }
.daily-date { font-size: 12px; color: rgba(255,255,255,0.25); }
.daily-count { margin-left: auto; font-size: 13px; color: rgba(255,255,255,0.3); }
.daily-empty { text-align: center; padding: 40px; color: rgba(255,255,255,0.2); font-size: 16px; }
.daily-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
.daily-item {
  display: flex; align-items: center; gap: 10px; padding: 12px; border-radius: 12px; cursor: pointer;
  transition: all 0.25s; border: 1px solid transparent;
}
.daily-item:hover { background: rgba(255,255,255,0.02); border-color: rgba(99,102,241,0.15); }
.daily-item.done { opacity: 0.35; }
.daily-check {
  width: 22px; height: 22px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center;
  transition: all 0.3s; color: transparent; flex-shrink: 0;
}
.daily-check.done { background: #10b981; border-color: #10b981; color: #fff; }
.daily-info { flex: 1; min-width: 0; }
.daily-name { font-size: 13px; color: rgba(255,255,255,0.75); display: block; }
.daily-name.done { text-decoration: line-through; }
.daily-parent { font-size: 11px; color: rgba(255,255,255,0.2); }
.daily-hours { font-size: 11px; color: rgba(255,255,255,0.25); padding: 2px 8px; border-radius: 6px; background: rgba(255,255,255,0.03); }

/* ====== 进度 ====== */
.progress-card { display: flex; align-items: center; gap: 20px; padding: 20px; margin-bottom: 12px; }
.progress-ring { width: 80px; height: 80px; flex-shrink: 0; }
.progress-ring circle:last-child { transition: stroke-dashoffset 0.8s ease; }
.progress-info { flex: 1; }
.progress-name { font-size: 15px; font-weight: 600; color: #e0e0e8; display: block; }
.progress-bar-sm { height: 3px; background: rgba(255,255,255,0.04); border-radius: 2px; margin: 8px 0; overflow: hidden; }
.progress-bar-sm-fill { height: 100%; border-radius: 2px; transition: width 0.6s ease; }
.progress-meta { font-size: 11px; color: rgba(255,255,255,0.2); }

/* ====== 弹窗 ====== */
.modal-overlay { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); }
.modal-card { background: #1a1a24; border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 28px; width: 380px; max-width: 90vw; }
.modal-title { font-size: 18px; font-weight: 600; color: #fff; }
.modal-desc { font-size: 12px; color: rgba(255,255,255,0.3); margin: 6px 0 16px; }
.modal-input { width: 100%; padding: 12px 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: #fff; font-size: 14px; outline: none; transition: border 0.2s; }
.modal-input:focus { border-color: rgba(99,102,241,0.4); }
.modal-btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.modal-cancel { padding: 8px 20px; border-radius: 10px; border: none; background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.4); cursor: pointer; font-size: 13px; }
.modal-ok { padding: 8px 20px; border-radius: 10px; border: none; background: #6366f1; color: #fff; cursor: pointer; font-size: 13px; font-weight: 500; }

/* ====== 动画 ====== */
.expand-enter-active, .expand-leave-active { transition: all 0.3s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { max-height: 2000px; }
.modal-enter-active { transition: all 0.25s ease; }
.modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-card { transform: scale(0.95) translateY(10px); }
.modal-leave-to .modal-card { transform: scale(0.95) translateY(10px); }
.stagger-in { animation: staggerIn 0.6s ease both; }
.stagger-in:nth-child(1) { animation-delay: 0.05s; }
.stagger-in:nth-child(2) { animation-delay: 0.1s; }
.stagger-in:nth-child(3) { animation-delay: 0.15s; }
.stagger-in:nth-child(4) { animation-delay: 0.2s; }
@keyframes staggerIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
