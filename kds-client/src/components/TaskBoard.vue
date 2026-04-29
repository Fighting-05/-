<template>
  <div class="shell" @mousemove="onMouse" @click="onClick">
    <!-- Canvas 粒子 -->
    <canvas ref="canvas" class="particles" />

    <!-- 噪点叠加 -->
    <div class="noise" />

    <!-- 几何装饰 -->
    <div class="geo-circle geo-1" />
    <div class="geo-circle geo-2" />
    <div class="geo-line" />

    <!-- 渐变光斑 -->
    <div class="blob blob-1" :style="blob1Style" />
    <div class="blob blob-2" :style="blob2Style" />

    <!-- 主内容 -->
    <div class="main" ref="mainRef" :style="mainParaStyle">

      <!-- ====== 头部：不对称布局 ====== -->
      <header class="hero" ref="heroRef">
        <div class="hero-left">
          <div class="hero-tag">STUDY</div>
          <h1 class="hero-title">{{ currentStage ? currentStage.name : '选择阶段' }}</h1>
          <div class="hero-stats">
            <div class="hstat">
              <span class="hstat-num">{{ totalTasks }}</span>
              <span class="hstat-label">子任务</span>
            </div>
            <div class="hstat">
              <span class="hstat-num">{{ completedTasks }}</span>
              <span class="hstat-label">已完成</span>
            </div>
            <div class="hstat">
              <span class="hstat-num">{{ totalHours.toFixed(1) }}h</span>
              <span class="hstat-label">总时长</span>
            </div>
          </div>
        </div>
        <div class="hero-right">
          <!-- 装饰斜线 -->
          <div class="hero-diagonal" />
          <!-- 环形进度 -->
          <div class="hero-ring-wrap">
            <svg class="hero-ring" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" :stop-color="ringGradStart"/>
                  <stop offset="100%" :stop-color="ringGradEnd"/>
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r="80" fill="none" stroke="var(--border-dim)" stroke-width="6"/>
              <circle cx="100" cy="100" r="80" fill="none" stroke="url(#ringGrad)" stroke-width="6"
                stroke-linecap="round" stroke-dasharray="502.6"
                :stroke-dashoffset="502.6 - (totalTasks > 0 ? (completedTasks / totalTasks) * 502.6 : 0)"
                class="ring-fill" />
            </svg>
            <div class="hero-ring-center">
              <span class="hero-ring-pct">{{ totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0 }}%</span>
              <span class="hero-ring-sub">完成率</span>
            </div>
          </div>
        </div>
      </header>

      <!-- ====== 导航 ====== -->
      <nav class="tabs-bar">
        <button v-for="tab in tabs" :key="tab.key" @click="viewMode = tab.key"
          class="tab" :class="{ on: viewMode === tab.key }">
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </nav>

      <!-- ====== 四张统计卡：对角线错位 ====== -->
      <div class="stat-grid">
        <div v-for="(card, i) in statCards" :key="card.label"
          class="stat-item" :class="`stat-offset-${i}`" :style="{ '--delay': i * 0.06 + 's' }">
          <div class="stat-icon" :style="{ '--icon-bg': card.bg }">{{ card.icon }}</div>
          <div class="stat-val">{{ card.value }}</div>
          <div class="stat-lbl">{{ card.label }}</div>
          <div class="stat-sub">{{ card.sub }}</div>
        </div>
      </div>

      <!-- ====== 科目选择：对角线流动 ====== -->
      <div class="subjects-row">
        <span class="section-tag">// 科目</span>
        <div class="pills-wrap">
          <button v-for="subj in subjects" :key="subj.id" @click="selectSubject(subj)"
            class="pill" :class="{ active: currentSubject?.id === subj.id }"
            :style="currentSubject?.id === subj.id ? { '--accent': subj.color } : {}">
            <span class="pill-emoji">{{ subjectIcons[subj.name] || '📖' }}</span>
            {{ subj.name }}
            <button v-if="subjects.length > 1" @click.stop="removeSubject(subj)" class="pill-x"><svg class="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </button>
          <button @click="addSubject" class="pill pill-add">+</button>
        </div>
      </div>

      <!-- 阶段 -->
      <div v-if="currentSubject" class="stages-row">
        <span class="section-tag">// 阶段</span>
        <div class="pills-wrap">
          <button v-for="st in currentStages" :key="st.id" @click="selectStage(st)"
            class="pill pill-sm" :class="{ active: currentStage?.id === st.id }"
            :style="currentStage?.id === st.id ? { '--accent': currentSubject.color } : {}">
            {{ st.name }}
            <button v-if="currentStages.length > 1" @click.stop="removeStage(st)" class="pill-x"><svg class="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </button>
          <button @click="addStage" class="pill pill-sm pill-add">+ 阶段</button>
        </div>
      </div>

      <!-- ====== 任务看板：打破网格 ====== -->
      <div v-if="viewMode === 'board'" class="board">
        <div v-for="(pt, i) in parentTasks" :key="pt.id"
          class="board-card" :class="{ expanded: expandedId === pt.id, dim: !pt.active, featured: i === 0 }"
          :style="{ '--delay': i * 0.05 + 's' }">
          <!-- 光线边 -->
          <div class="board-card-edge" />
          <!-- 内容 -->
          <div class="board-card-inner" @click="expandedId === pt.id ? (expandedId = null) : openParent(pt)">
            <div class="board-top">
              <div class="board-avatar" :style="{ background: parentColor(pt) }">{{ pt.name[0] }}</div>
              <div class="board-meta">
                <span class="board-name">{{ pt.name }}</span>
                <span class="board-count">{{ activeTasksFor(pt.id) }} pending</span>
              </div>
              <div class="board-btns" @click.stop>
                <button @click="toggleActive(pt)" class="board-btn" :title="pt.active ? '隐藏' : '显示'">
                  <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                <button @click="addChildTask(pt)" class="board-btn" title="添加子任务">
                  <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>
            </div>
            <!-- 进度 -->
            <div class="board-progress">
              <div class="board-bar"><div class="board-bar-fill" :style="{ width: getParentProgress(pt.id) + '%', background: parentColor(pt) }" /></div>
              <span class="board-pct">{{ getDoneCount(pt.id) }}/{{ getTotalCount(pt.id) }}</span>
            </div>
            <!-- 子任务 -->
            <Transition name="expand">
              <div v-if="expandedId === pt.id" class="board-subs" @click.stop>
                <div v-if="childTasks[pt.id]?.length">
                  <div v-for="(ct, idx) in childTasks[pt.id]" :key="ct.id" class="sub-row">
                    <button @click="toggleComplete(ct)" class="sub-check" :class="{ done: ct.completed }">
                      <svg v-if="ct.completed" class="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                    <span class="sub-name" :class="{ done: ct.completed }">{{ ct.name }}</span>
                    <span class="sub-hrs" @click.stop="startEditHours(ct)" :class="{ custom: ct.custom_hours != null }">
                      <input v-if="editingHours === ct.id" v-model.number="editHourVal" type="number" step="0.1" class="hrs-inp" @keydown.enter="saveHours(ct)" @blur="saveHours(ct)" ref="hourInput" />
                      <template v-else>{{ getTaskHours(ct) }}h</template>
                    </span>
                    <div class="sub-ops">
                      <button @click="moveChildTask(pt.id, idx, -1)" :disabled="idx === 0">↑</button>
                      <button @click="moveChildTask(pt.id, idx, 1)" :disabled="idx === childTasks[pt.id].length - 1">↓</button>
                      <button @click="removeChildTask(ct.id)" class="del">✕</button>
                    </div>
                  </div>
                </div>
                <div v-else class="sub-empty">点击 + 添加第一个子任务</div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <!-- ====== 今日推送 ====== -->
      <div v-if="viewMode === 'daily'" class="daily">
        <div class="daily-card">
          <div class="daily-left">
            <div class="daily-badge">{{ new Date().getDate() }}</div>
            <span class="daily-month">{{ new Date().toLocaleDateString('zh-CN', { month:'short' }) }}月</span>
          </div>
          <div class="daily-mid">
            <h3 class="daily-ttl">今日推送</h3>
            <p class="daily-date">{{ new Date().toLocaleDateString('zh-CN', { weekday:'long', month:'long', day:'numeric' }) }}</p>
          </div>
          <span class="daily-ct">{{ dailyTasks.filter(t => t.completed).length }}/{{ dailyTasks.length }}</span>
        </div>
        <div v-if="dailyTasks.length === 0" class="daily-none">🎉 全部完成！</div>
        <div v-else class="daily-grid">
          <div v-for="dt in dailyTasks" :key="dt.id" @click="doCheckin(dt)" class="daily-row" :class="{ done: dt.completed }">
            <div class="daily-chk" :class="{ done: dt.completed }">
              <svg v-if="dt.completed" class="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <span class="daily-nm" :class="{ done: dt.completed }">{{ dt.name }}</span>
              <span class="daily-pt">{{ dt.parent_name }}</span>
            </div>
            <span class="daily-hr">{{ getTaskHours(dt) }}h</span>
          </div>
        </div>
      </div>

      <!-- ====== 进度 ====== -->
      <div v-if="viewMode === 'progress'" class="progress">
        <div v-for="p in progressData" :key="p.parent_id" class="prog-card">
          <svg class="prog-ring" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="30" fill="none" stroke="var(--border-dim)" stroke-width="5"/>
            <circle cx="40" cy="40" r="30" fill="none" :stroke="parentColor(p)" stroke-width="5" stroke-linecap="round"
              :stroke-dasharray="188.5" :stroke-dashoffset="188.5 - (p.total > 0 ? (p.done / p.total) * 188.5 : 0)" />
            <text x="40" y="38" text-anchor="middle" fill="#fff" font-size="11" font-weight="600">{{ p.total > 0 ? Math.round(p.done / p.total * 100) : 0 }}%</text>
          </svg>
          <div class="prog-info">
            <span class="prog-name">{{ p.parent_name }}</span>
            <div class="prog-bar"><div class="prog-bar-fill" :style="{ width: (p.total > 0 ? (p.done / p.total * 100) : 0) + '%', background: parentColor(p) }" /></div>
            <span class="prog-meta">{{ p.done }}/{{ p.total }} · {{ p.done_hours?.toFixed(1) }}h</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="footer">
        <span>KDS</span>
        <span class="footer-div">·</span>
        <span>考研动态调度执行系统</span>
      </footer>
    </div>

    <!-- 弹窗 -->
    <Transition name="modal">
      <div v-if="showModal" class="modal" @click.self="closeModal">
        <div class="modal-box">
          <h3 class="modal-ttl">{{ modalTitle }}</h3>
          <p class="modal-sub">{{ modalDesc }}</p>
          <input ref="modalInput" v-model="modalValue" :placeholder="modalPlaceholder" class="modal-inp" @keydown.enter="confirmModal" />
          <div class="modal-ops">
            <button @click="closeModal" class="modal-no">取消</button>
            <button @click="confirmModal" class="modal-yes">确定</button>
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
  { key: 'board', label: '看板', icon: '◫' },
  { key: 'daily', label: '今日', icon: '◷' },
  { key: 'progress', label: '进度', icon: '◉' },
]
const PCOLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6']
function parentColor(pt) {
  if (!pt._c) pt._c = PCOLORS[Math.abs(String(pt.name||pt.parent_name||'').split('').reduce((s,c)=>s+c.charCodeAt(0),0))%PCOLORS.length]
  return pt._c
}

/* ====== 粒子 ====== */
const canvas = ref(null)
const mouse = reactive({ x:0, y:0, tx:0, ty:0 })
const clickPos = reactive({ x:0, y:0, a:false })
let parts=[], raf, ctx
function initParts() {
  if (!canvas.value) return
  canvas.value.width = innerWidth; canvas.value.height = innerHeight
  ctx = canvas.value.getContext('2d')
  parts = Array.from({length:100},()=>({
    x:Math.random()*canvas.value.width, y:Math.random()*canvas.value.height,
    vx:(Math.random()-.5)*.25, vy:(Math.random()-.5)*.25,
    r:Math.random()*1.2+.4, br:0, a:Math.random()*.4+.1,
    h:[250,270,290,310][Math.floor(Math.random()*4)]
  }))
  parts.forEach(p=>p.br=p.r)
}
function animParts() {
  if(!ctx||!canvas.value) return
  ctx.clearRect(0,0,canvas.value.width,canvas.value.height)
  mouse.tx+=(mouse.x-mouse.tx)*.06; mouse.ty+=(mouse.y-mouse.ty)*.06
  if(clickPos.a) clickPos.a=false
  for(const p of parts){
    const dx=mouse.tx-p.x, dy=mouse.ty-p.y, dist=Math.hypot(dx,dy)
    if(dist<140){ const f=(1-dist/140)*2.5; p.vx-=(dx/dist)*f*.12; p.vy-=(dy/dist)*f*.12; p.r=p.br+f*1.8 }
    else p.r+=(p.br-p.r)*.08
    if(clickPos.a){ const cd=Math.hypot(clickPos.x-p.x,clickPos.y-p.y); if(cd<180){ p.vx+=((clickPos.x-p.x)/cd)*(1-cd/180)*4; p.vy+=((clickPos.y-p.y)/cd)*(1-cd/180)*4 } }
    p.vx*=.99; p.vy*=.99; p.x+=p.vx; p.y+=p.vy
    if(p.x<0)p.x=canvas.value.width; if(p.x>canvas.value.width)p.x=0
    if(p.y<0)p.y=canvas.value.height; if(p.y>canvas.value.height)p.y=0
    for(const q of parts){ if(p===q)continue; const d=Math.hypot(p.x-q.x,p.y-q.y); if(d<90){ ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.strokeStyle=`hsla(${p.h},60%,60%,${(1-d/90)*.04})`; ctx.stroke() } }
  }
  for(const p of parts){ ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=`hsla(${p.h},65%,62%,${p.a})`; ctx.shadowColor=`hsl(${p.h},65%,58%)`; ctx.shadowBlur=p.r*4; ctx.fill(); ctx.shadowBlur=0 }
  raf=requestAnimationFrame(animParts)
}
function onMouse(e){ mouse.x=e.clientX; mouse.y=e.clientY }
function onClick(e){ clickPos.x=e.clientX; clickPos.y=e.clientY; clickPos.a=true }

/* ====== 视差和渐变 ====== */
const mainParaStyle = computed(()=>({ transform:`translate(${(mouse.x-innerWidth/2)*.006}px,${(mouse.y-innerHeight/2)*.006}px)` }))
const blob1Style = computed(()=>({ transform:`translate(${(mouse.x-innerWidth/2)*.02}px,${(mouse.y-innerHeight/2)*.02}px)` }))
const blob2Style = computed(()=>({ transform:`translate(${-(mouse.x-innerWidth/2)*.015}px,${-(mouse.y-innerHeight/2)*.015}px)` }))
const ringGradStart = computed(()=>{ const p=totalTasks.value>0?completedTasks.value/totalTasks.value:0; return `hsl(${250+p*40},70%,${55+p*20}%)` })
const ringGradEnd   = computed(()=>{ const p=totalTasks.value>0?completedTasks.value/totalTasks.value:0; return `hsl(${290+p*50},80%,${60+p*15}%)` })

/* ====== 状态 ====== */
const viewMode=ref('board'), subjects=ref([]), currentSubject=ref(null), currentStages=ref([]), currentStage=ref(null)
const parentTasks=ref([]), childTasks=reactive({}), expandedId=ref(null)
const editingHours=ref(null), editHourVal=ref(0), hourInput=ref(null)
const dailyTasks=ref([]), progressData=ref([])
const showModal=ref(false), modalTitle=ref(''), modalDesc=ref(''), modalValue=ref(''), modalPlaceholder=ref('')
let modalAction=null; const modalInput=ref(null)

const totalTasks=computed(()=>{let n=0;Object.values(childTasks).forEach(a=>{if(Array.isArray(a))n+=a.length});return n})
const completedTasks=computed(()=>{let n=0;Object.values(childTasks).forEach(a=>{if(Array.isArray(a))n+=a.filter(c=>c.completed).length});return n})
const totalHours=computed(()=>{let h=0;Object.values(childTasks).forEach(a=>{if(Array.isArray(a))a.forEach(c=>h+=getTaskHours(c))});return h})
const statCards=computed(()=>[
  {label:'父任务',value:parentTasks.value.length,icon:'⊞',bg:'var(--clr-indigo)',sub:`${parentTasks.value.filter(p=>p.active).length} 本启用`},
  {label:'子任务',value:totalTasks.value,icon:'⊟',bg:'var(--clr-pink)',sub:`${completedTasks.value} 已攻克`},
  {label:'总时长',value:totalHours.value.toFixed(1)+'h',icon:'⊠',bg:'var(--clr-emerald)',sub:'学习总量'},
  {label:'完成率',value:(totalTasks.value>0?Math.round(completedTasks.value/totalTasks.value*100):0)+'%',icon:'⊡',bg:'var(--clr-amber)',sub:'继续加油'},
])
function getTaskHours(ct){return ct.custom_hours!=null?ct.custom_hours:ct.default_hours}
function getDoneCount(pid){const c=childTasks[pid];return c?c.filter(t=>t.completed).length:0}
function getTotalCount(pid){return childTasks[pid]?.length||0}
function getParentProgress(pid){const c=childTasks[pid];return c&&c.length?Math.round(c.filter(t=>t.completed).length/c.length*100):0}
function activeTasksFor(pid){const c=childTasks[pid];return c?c.filter(t=>!t.completed).length:0}
function openModal(t,d,p,a){modalTitle.value=t;modalDesc.value=d;modalPlaceholder.value=p;modalValue.value='';modalAction=a;showModal.value=true;setTimeout(()=>modalInput.value?.focus(),100)}
function closeModal(){showModal.value=false;modalAction=null}
function confirmModal(){if(modalAction&&modalValue.value.trim())modalAction(modalValue.value.trim());closeModal()}

async function loadSubjects(){try{const r=await fetchSubjects();subjects.value=r.data.data;if(subjects.value.length>0&&!currentSubject.value)selectSubject(subjects.value[0])}catch{}}
async function selectSubject(s){currentSubject.value=s;currentStage.value=null;parentTasks.value=[];expandedId.value=null;Object.keys(childTasks).forEach(k=>delete childTasks[k]);try{const r=await getStages(s.id);currentStages.value=r.data.data;if(currentStages.value.length>0)selectStage(currentStages.value[0])}catch{}}
async function selectStage(s){currentStage.value=s;expandedId.value=null;Object.keys(childTasks).forEach(k=>delete childTasks[k]);try{const r=await getParentTasks(s.id);parentTasks.value=r.data.data}catch{}}
async function openParent(pt){expandedId.value=expandedId.value===pt.id?null:pt.id;if(expandedId.value&&!childTasks[pt.id]){try{const r=await getChildTasks(pt.id);childTasks[pt.id]=r.data.data}catch{}}}
async function addSubject(){openModal('新增科目','输入科目名称','数学、408、英语、政治',async(n)=>{try{await createSubject({name:n});await loadSubjects()}catch{emit('toast','失败')}})}
async function removeSubject(s){if(!confirm(`删除「${s.name}」？`))return;try{await deleteSubject(s.id);if(currentSubject.value?.id===s.id){currentSubject.value=null;currentStages.value=[];currentStage.value=null;parentTasks.value=[]}await loadSubjects()}catch{}}
async function addStage(){if(!currentSubject.value)return;openModal('新增阶段',`为「${currentSubject.value.name}」添加`,'高数基础、真题阶段',async(n)=>{try{await createStage({subject_id:currentSubject.value.id,name:n});const r=await getStages(currentSubject.value.id);currentStages.value=r.data.data}catch{}})}
async function removeStage(s){if(!confirm(`删除「${s.name}」？`))return;try{await deleteStage(s.id);if(currentStage.value?.id===s.id){currentStage.value=null;parentTasks.value=[];Object.keys(childTasks).forEach(k=>delete childTasks[k])};const r=await getStages(currentSubject.value.id);currentStages.value=r.data.data;if(currentStages.value.length>0&&!currentStage.value)selectStage(currentStages.value[0])}catch{}}
async function addChildTask(pt){openModal('新增子任务',`添加到「${pt.name}」`,'子任务名称',async(n)=>{try{await createChildTask({parent_task_id:pt.id,name:n});if(childTasks[pt.id]){const r=await getChildTasks(pt.id);childTasks[pt.id]=r.data.data}else openParent(pt)}catch{}})}
async function toggleActive(pt){try{await updateParentTask(pt.id,{active:!pt.active});pt.active=!pt.active}catch{}}
async function removeParentTask(id){try{await deleteParentTask(id);parentTasks.value=parentTasks.value.filter(p=>p.id!==id);delete childTasks[id];expandedId.value=null}catch{}}
async function toggleComplete(ct){try{if(ct.completed){await uncheckTask(ct.id);ct.completed=false;ct.actual_hours=0;ct.study_date=null}else{const h=getTaskHours(ct);await checkinTask(ct.id,h);ct.completed=true;ct.actual_hours=h}}catch{}}
async function startEditHours(ct){editingHours.value=ct.id;editHourVal.value=getTaskHours(ct);await nextTick();hourInput.value?.focus?.();hourInput.value?.select?.()}
async function saveHours(ct){await updateChildTask(ct.id,{custom_hours:editHourVal.value});ct.custom_hours=editHourVal.value;editingHours.value=null}
async function moveChildTask(pid,idx,dir){const a=childTasks[pid];if(!a)return;const ni=idx+dir;if(ni<0||ni>=a.length)return;a.splice(ni,0,a.splice(idx,1)[0]);await reorderChildTasks(a.map(c=>c.id))}
async function removeChildTask(id){await deleteChildTask(id);Object.keys(childTasks).forEach(k=>{childTasks[k]=childTasks[k]?.filter(c=>c.id!==id)})}
async function loadDaily(){try{const r=await getDailyTasks();dailyTasks.value=r.data.data.tasks}catch{}}
async function doCheckin(dt){if(dt.completed){await uncheckTask(dt.id);dt.completed=false}else{await checkinTask(dt.id,getTaskHours(dt));dt.completed=true}}
async function loadProgress(){if(!currentStage.value)return;try{const r=await getStudyProgress(currentStage.value.id);progressData.value=r.data.data}catch{}}
watch(viewMode,v=>{if(v==='daily')loadDaily();if(v==='progress')loadProgress()})
onMounted(()=>{loadSubjects();initParts();raf=requestAnimationFrame(animParts);window.addEventListener('resize',initParts)})
onUnmounted(()=>{if(raf)cancelAnimationFrame(raf);window.removeEventListener('resize',initParts)})
</script>

<style scoped>
/* ==================== CSS 变量 ==================== */
.shell {
  --bg: #0a0a10;
  --surface: rgba(255,255,255,0.015);
  --surface-hover: rgba(255,255,255,0.03);
  --border: rgba(255,255,255,0.05);
  --border-dim: rgba(255,255,255,0.03);
  --text: rgba(255,255,255,0.85);
  --text-dim: rgba(255,255,255,0.35);
  --text-faint: rgba(255,255,255,0.15);
  --clr-indigo: rgba(99,102,241,0.18);
  --clr-pink: rgba(236,72,153,0.18);
  --clr-emerald: rgba(16,185,129,0.18);
  --clr-amber: rgba(245,158,11,0.18);
  --accent: #6366f1;
  --font-display: 'ZCOOL XiaoWei', 'PingFang SC', serif;
  --font-mono: 'Space Mono', 'JetBrains Mono', monospace;
  --font-grotesk: 'Space Grotesk', 'PingFang SC', sans-serif;
  min-height: 100vh; background: var(--bg); color: var(--text);
  position: relative; overflow-x: hidden; cursor: crosshair;
  font-family: var(--font-grotesk);
}

/* ==================== Canvas ==================== */
.particles { position: fixed; inset: 0; z-index: 0; pointer-events: none; }

/* ==================== 噪点纹理 ==================== */
.noise {
  position: fixed; inset: 0; z-index: 1; pointer-events: none; opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 256px;
}

/* ==================== 几何装饰 ==================== */
.geo-circle {
  position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
  border: 1px solid rgba(255,255,255,0.03);
}
.geo-1 { width: 500px; height: 500px; top: -200px; right: -150px; }
.geo-2 { width: 300px; height: 300px; bottom: -100px; left: -100px; }
.geo-line {
  position: fixed; top: 0; left: 50%; width: 1px; height: 100%;
  background: linear-gradient(transparent, rgba(255,255,255,0.02) 30%, rgba(255,255,255,0.02) 70%, transparent);
  pointer-events: none; z-index: 0; transform: rotate(15deg);
}

/* ==================== 光斑 ==================== */
.blob {
  position: fixed; border-radius: 50%; filter: blur(140px); pointer-events: none; z-index: 0;
  transition: transform 1.5s cubic-bezier(0.16,1,0.3,1);
}
.blob-1 { width: 500px; height: 400px; top: -10%; left: -8%; background: radial-gradient(ellipse, rgba(99,102,241,0.1), transparent 70%); }
.blob-2 { width: 450px; height: 350px; bottom: -15%; right: -5%; background: radial-gradient(ellipse, rgba(139,92,246,0.08), transparent 70%); }

/* ==================== 主内容 ==================== */
.main {
  position: relative; z-index: 2; max-width: 1100px; margin: 0 auto; padding: 56px 36px 80px;
  transition: transform 0.7s cubic-bezier(0.16,1,0.3,1);
}

/* ==================== 头部 ==================== */
.hero {
  display: flex; gap: 60px; margin-bottom: 48px; position: relative;
  padding: 48px 52px; background: var(--surface); border: 1px solid var(--border);
  border-radius: 28px; backdrop-filter: blur(24px); overflow: hidden;
}
.hero-left { flex: 1; }
.hero-tag {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 4px;
  color: var(--accent); margin-bottom: 12px;
}
.hero-title {
  font-family: var(--font-display); font-size: 42px; font-weight: 400; line-height: 1.2;
  color: #fff; letter-spacing: 2px; margin: 0;
}
.hero-stats { display: flex; gap: 28px; margin-top: 20px; }
.hstat { display: flex; flex-direction: column; }
.hstat-num { font-family: var(--font-grotesk); font-size: 22px; font-weight: 700; color: #fff; }
.hstat-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 2px; margin-top: 2px; }

.hero-right { position: relative; flex-shrink: 0; display: flex; align-items: center; }
.hero-diagonal {
  position: absolute; top: -20px; right: -20px; width: 100px; height: 100px;
  border-right: 1px solid var(--border); border-top: 1px solid var(--border);
  border-radius: 0 20px 0 0;
}
.hero-ring-wrap { position: relative; }
.hero-ring { width: 170px; height: 170px; display: block; }
.ring-fill { transition: stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1); }
.hero-ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.hero-ring-pct { font-family: var(--font-grotesk); font-size: 30px; font-weight: 700; color: #fff; }
.hero-ring-sub { font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 2px; margin-top: 2px; }

/* ==================== 导航 ==================== */
.tabs-bar { display: flex; gap: 4px; margin-bottom: 32px; }
.tab {
  display: flex; align-items: center; gap: 8px; padding: 10px 22px; border-radius: 14px;
  border: 1px solid transparent; background: none; color: var(--text-dim);
  font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.3s;
  font-family: var(--font-grotesk);
}
.tab:hover { color: var(--text); background: var(--surface); }
.tab.on { background: rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.2); color: #a5b4fc; }
.tab-icon { font-size: 15px; }
.tab-label { font-size: 13px; }

/* ==================== 统计卡片：对角线偏移 ==================== */
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 36px; }
.stat-item {
  background: var(--surface); border: 1px solid var(--border); border-radius: 20px;
  padding: 22px; backdrop-filter: blur(16px); position: relative;
  animation: statIn 0.7s cubic-bezier(0.16,1,0.3,1) both;
  animation-delay: var(--delay, 0s); transition: transform 0.4s, border-color 0.4s;
}
.stat-item:hover { transform: translateY(-4px); border-color: rgba(99,102,241,0.2); }
.stat-offset-0 { margin-top: 0; }
.stat-offset-1 { margin-top: 12px; }
.stat-offset-2 { margin-top: 24px; }
.stat-offset-3 { margin-top: 36px; }
@keyframes statIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.stat-icon { width: 36px; height: 36px; border-radius: 10px; background: var(--icon-bg); display: flex; align-items: center; justify-content: center; font-size: 16px; margin-bottom: 12px; }
.stat-val { font-family: var(--font-grotesk); font-size: 26px; font-weight: 700; color: #fff; }
.stat-lbl { font-family: var(--font-mono); font-size: 10px; color: var(--text-faint); text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
.stat-sub { font-size: 11px; color: var(--text-dim); margin-top: 2px; }

/* ==================== 标签 ==================== */
.section-tag { font-family: var(--font-mono); font-size: 10px; color: var(--text-faint); letter-spacing: 2px; margin-right: 12px; flex-shrink: 0; padding-top: 10px; }
.subjects-row, .stages-row { display: flex; align-items: flex-start; margin-bottom: 20px; }
.pills-wrap { display: flex; gap: 8px; flex-wrap: wrap; }
.pill {
  display: flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: 12px;
  background: var(--surface); border: 1px solid var(--border); color: var(--text-dim);
  font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.3s;
  font-family: var(--font-grotesk); position: relative;
}
.pill:hover { background: var(--surface-hover); color: var(--text); border-color: rgba(255,255,255,0.1); }
.pill.active { background: var(--accent, #6366f1); border-color: var(--accent, #6366f1); color: #fff; }
.pill:active { animation: pillBounce 0.35s cubic-bezier(0.34,1.56,0.64,1); }
@keyframes pillBounce { 0%,100%{transform:scale(1)} 40%{transform:scale(.88)} 70%{transform:scale(1.04)} }
.pill-sm { font-size: 12px; padding: 6px 14px; }
.pill-add { border-style: dashed; color: var(--text-faint); }
.pill-add:hover { color: var(--text-dim); }
.pill-emoji { font-size: 15px; }
.pill-x {
  position: absolute; top: -6px; right: -6px; width: 16px; height: 16px;
  border-radius: 50%; background: #ef4444; color: #fff; display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s; border: none; cursor: pointer;
}
.pill:hover .pill-x { opacity: 1; }

/* ==================== 看板 ==================== */
.board { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.board-card {
  border-radius: 20px; position: relative; overflow: hidden;
  animation: statIn 0.6s cubic-bezier(0.16,1,0.3,1) both;
  animation-delay: var(--delay, 0s);
  transition: transform 0.4s, opacity 0.4s;
}
.board-card:hover { transform: translateY(-3px); }
.board-card.dim { opacity: 0.35; }
.board-card.featured { grid-column: span 2; }
.board-card-edge {
  position: absolute; inset: 0; border-radius: 20px; padding: 1px;
  background: linear-gradient(135deg, rgba(99,102,241,0.2), transparent 50%, rgba(139,92,246,0.15));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  pointer-events: none; opacity: 0; transition: opacity 0.5s;
}
.board-card:hover .board-card-edge { opacity: 1; }
.board-card-inner {
  background: var(--surface); backdrop-filter: blur(20px); border-radius: 20px;
  padding: 22px; cursor: pointer;
}
.board-top { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.board-avatar { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; color: #fff; }
.board-meta { flex: 1; min-width: 0; }
.board-name { font-size: 14px; font-weight: 600; color: var(--text); display: block; }
.board-count { font-family: var(--font-mono); font-size: 10px; color: var(--text-faint); text-transform: uppercase; letter-spacing: 1px; }
.board-btns { display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; }
.board-card:hover .board-btns { opacity: 1; }
.board-btn {
  padding: 6px; border-radius: 8px; border: none; background: rgba(255,255,255,0.03); color: var(--text-dim); cursor: pointer; transition: all 0.2s;
}
.board-btn:hover { background: rgba(255,255,255,0.06); color: var(--text); }
.board-progress { display: flex; align-items: center; gap: 10px; }
.board-bar { flex: 1; height: 3px; background: var(--border-dim); border-radius: 2px; overflow: hidden; }
.board-bar-fill { height: 100%; border-radius: 2px; transition: width 0.6s cubic-bezier(0.16,1,0.3,1); }
.board-pct { font-family: var(--font-mono); font-size: 10px; color: var(--text-faint); }

/* 子任务 */
.board-subs { margin-top: 16px; border-top: 1px solid var(--border-dim); padding-top: 12px; max-height: 340px; overflow-y: auto; }
.sub-row { display: flex; align-items: center; gap: 10px; padding: 7px 4px; border-radius: 8px; transition: background 0.2s; }
.sub-row:hover { background: var(--surface-hover); }
.sub-check {
  width: 18px; height: 18px; border-radius: 5px; border: 2px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;
  background: none; cursor: pointer; transition: all 0.3s; color: transparent; flex-shrink: 0;
}
.sub-check.done { background: #10b981; border-color: #10b981; color: #fff; }
.sub-check:hover { border-color: rgba(16,185,129,0.4); }
.sub-name { flex: 1; font-size: 13px; color: var(--text-dim); transition: all 0.3s; }
.sub-name.done { color: var(--text-faint); text-decoration: line-through; }
.sub-hrs { font-family: var(--font-mono); font-size: 11px; color: var(--text-faint); cursor: pointer; padding: 2px 6px; border-radius: 4px; transition: all 0.2s; position: relative; }
.sub-hrs:hover { background: var(--surface); }
.sub-hrs.custom { color: #a5b4fc; }
.hrs-inp { width: 48px; background: rgba(0,0,0,0.5); border: 1px solid rgba(99,102,241,0.3); border-radius: 6px; padding: 2px 6px; color: #fff; font-size: 11px; text-align: center; outline: none; position: absolute; right: -4px; top: -6px; }
.sub-ops { display: flex; gap: 2px; opacity: 0; transition: opacity 0.2s; }
.sub-row:hover .sub-ops { opacity: 1; }
.sub-ops button { width: 20px; height: 20px; border-radius: 4px; border: none; background: none; color: var(--text-faint); cursor: pointer; font-size: 11px; transition: all 0.2s; }
.sub-ops button:hover:not(:disabled) { color: var(--text-dim); background: var(--surface); }
.sub-ops button:disabled { opacity: 0.15; }
.sub-ops .del:hover { color: #ef4444; }
.sub-empty { text-align: center; padding: 20px; color: var(--text-faint); font-size: 12px; }

/* ==================== 今日推送 ==================== */
.daily { max-width: 800px; }
.daily-card { display: flex; align-items: center; gap: 16px; padding: 28px; background: var(--surface); border: 1px solid var(--border); border-radius: 24px; margin-bottom: 16px; backdrop-filter: blur(16px); }
.daily-left { display: flex; flex-direction: column; align-items: center; }
.daily-badge { font-family: var(--font-grotesk); font-size: 28px; font-weight: 700; color: #a5b4fc; }
.daily-month { font-family: var(--font-mono); font-size: 10px; color: var(--text-dim); text-transform: uppercase; }
.daily-mid { flex: 1; }
.daily-ttl { font-size: 16px; font-weight: 600; color: #fff; margin: 0; }
.daily-date { font-size: 12px; color: var(--text-dim); }
.daily-ct { font-family: var(--font-mono); font-size: 13px; color: var(--text-dim); }
.daily-none { text-align: center; padding: 48px; color: var(--text-dim); font-size: 18px; }
.daily-grid { display: flex; flex-direction: column; gap: 4px; }
.daily-row {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 14px;
  cursor: pointer; transition: all 0.25s; border: 1px solid transparent;
}
.daily-row:hover { background: var(--surface); border-color: rgba(99,102,241,0.12); }
.daily-row.done { opacity: 0.3; }
.daily-chk {
  width: 20px; height: 20px; border-radius: 6px; border: 2px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center;
  transition: all 0.3s; color: transparent; flex-shrink: 0;
}
.daily-chk.done { background: #10b981; border-color: #10b981; color: #fff; }
.daily-nm { font-size: 13px; color: var(--text); display: block; }
.daily-nm.done { text-decoration: line-through; }
.daily-pt { font-size: 11px; color: var(--text-faint); }
.daily-hr { font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); padding: 2px 8px; border-radius: 6px; background: var(--surface); }

/* ==================== 进度 ==================== */
.progress { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.prog-card { display: flex; align-items: center; gap: 18px; padding: 20px; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; backdrop-filter: blur(16px); transition: all 0.3s; }
.prog-card:hover { border-color: rgba(255,255,255,0.1); }
.prog-ring { width: 70px; height: 70px; flex-shrink: 0; }
.prog-ring circle:last-child { transition: stroke-dashoffset 0.8s ease; }
.prog-info { flex: 1; }
.prog-name { font-size: 14px; font-weight: 600; color: var(--text); display: block; }
.prog-bar { height: 3px; background: var(--border-dim); border-radius: 2px; margin: 8px 0; overflow: hidden; }
.prog-bar-fill { height: 100%; border-radius: 2px; transition: width 0.6s ease; }
.prog-meta { font-family: var(--font-mono); font-size: 10px; color: var(--text-faint); }

/* ==================== Footer ==================== */
.footer { display: flex; justify-content: center; gap: 8px; margin-top: 64px; font-size: 11px; color: var(--text-faint); }
.footer-div { color: var(--border); }

/* ==================== 弹窗 ==================== */
.modal { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5); backdrop-filter: blur(6px); }
.modal-box { background: #14141e; border: 1px solid rgba(255,255,255,0.06); border-radius: 22px; padding: 30px; width: 380px; max-width: 90vw; }
.modal-ttl { font-family: var(--font-display); font-size: 20px; font-weight: 400; color: #fff; letter-spacing: 1px; }
.modal-sub { font-size: 12px; color: var(--text-dim); margin: 6px 0 18px; }
.modal-inp { width: 100%; padding: 12px 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: #fff; font-size: 14px; outline: none; transition: border 0.2s; font-family: var(--font-grotesk); }
.modal-inp:focus { border-color: rgba(99,102,241,0.4); }
.modal-ops { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.modal-no { padding: 8px 20px; border-radius: 10px; border: none; background: rgba(255,255,255,0.04); color: var(--text-dim); cursor: pointer; font-size: 13px; }
.modal-yes { padding: 8px 20px; border-radius: 10px; border: none; background: var(--accent); color: #fff; cursor: pointer; font-size: 13px; font-weight: 500; }

/* ==================== 过渡 ==================== */
.expand-enter-active,.expand-leave-active{transition:all .3s ease;overflow:hidden}
.expand-enter-from,.expand-leave-to{opacity:0;max-height:0}
.expand-enter-to,.expand-leave-from{max-height:2000px}
.modal-enter-active{transition:all .25s ease}
.modal-leave-active{transition:all .2s ease}
.modal-enter-from,.modal-leave-to{opacity:0}
.modal-enter-from .modal-box{transform:scale(.95) translateY(10px)}
.modal-leave-to .modal-box{transform:scale(.95) translateY(10px)}
</style>
