<template>
  <div class="min-h-screen grid lg:grid-cols-2" @mousemove="onMouseMove">
    <!-- ==================== 左侧：品牌区 + 抽象角色 ==================== -->
    <div class="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#6C3FF5] via-[#6C3FF5] to-[#5B32D9] p-12 text-white overflow-hidden">
      <!-- Logo -->
      <div class="relative z-20">
        <div class="flex items-center gap-2 text-lg font-semibold">
          <div class="size-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span>YourBrand</span>
        </div>
      </div>

      <!-- 抽象角色容器 -->
      <div class="relative z-20 flex items-end justify-center h-[500px]">
        <div class="relative" style="width: 550px; height: 400px;">
          <!-- ===== 紫色角色（最高最活泼） ===== -->
          <div
            ref="purpleRef"
            class="absolute bottom-0"
            :style="purpleStyle"
          >
            <div
              ref="purpleEyeClusterRef"
              class="absolute flex gap-8"
              :style="{ left: purpleEyeLeft + 'px', top: purpleEyeTop + 'px' }"
            >
              <div
                class="rounded-full flex items-center justify-center transition-all duration-150"
                :style="purpleEyeStyle"
              >
                <div
                  v-if="!isPurpleBlinking"
                  class="rounded-full"
                  :style="purplePupilLStyle"
                />
              </div>
              <div
                class="rounded-full flex items-center justify-center transition-all duration-150"
                :style="purpleEyeStyle"
              >
                <div
                  v-if="!isPurpleBlinking"
                  class="rounded-full"
                  :style="purplePupilRStyle"
                />
              </div>
            </div>
          </div>

          <!-- ===== 黑色角色（中等身材） ===== -->
          <div
            ref="blackRef"
            class="absolute bottom-0"
            :style="blackStyle"
          >
            <div
              ref="blackEyeClusterRef"
              class="absolute flex gap-6"
              :style="{ left: blackEyeLeft + 'px', top: blackEyeTop + 'px' }"
            >
              <div
                class="rounded-full flex items-center justify-center transition-all duration-150"
                :style="{ width: '16px', height: isBlackBlinking ? '2px' : '16px', backgroundColor: 'white', overflow: 'hidden' }"
              >
                <div
                  v-if="!isBlackBlinking"
                  class="rounded-full"
                  :style="{ width: '6px', height: '6px', backgroundColor: '#2D2D2D', transform: `translate(${blackPupilL.x}px, ${blackPupilL.y}px)`, transition: 'transform 0.1s ease-out' }"
                />
              </div>
              <div
                class="rounded-full flex items-center justify-center transition-all duration-150"
                :style="{ width: '16px', height: isBlackBlinking ? '2px' : '16px', backgroundColor: 'white', overflow: 'hidden' }"
              >
                <div
                  v-if="!isBlackBlinking"
                  class="rounded-full"
                  :style="{ width: '6px', height: '6px', backgroundColor: '#2D2D2D', transform: `translate(${blackPupilR.x}px, ${blackPupilR.y}px)`, transition: 'transform 0.1s ease-out' }"
                />
              </div>
            </div>
          </div>

          <!-- ===== 橙色角色（矮胖背景） ===== -->
          <div
            ref="orangeRef"
            class="absolute bottom-0"
            :style="orangeStyle"
          >
            <div
              ref="orangeEyeClusterRef"
              class="absolute flex gap-8"
              :style="{ left: orangeEyeLeft + 'px', top: orangeEyeTop + 'px' }"
            >
              <div
                class="rounded-full"
                :style="{ width: '12px', height: '12px', backgroundColor: '#2D2D2D', transform: `translate(${orangePupilL.x}px, ${orangePupilL.y}px)`, transition: 'transform 0.1s ease-out' }"
              />
              <div
                class="rounded-full"
                :style="{ width: '12px', height: '12px', backgroundColor: '#2D2D2D', transform: `translate(${orangePupilR.x}px, ${orangePupilR.y}px)`, transition: 'transform 0.1s ease-out' }"
              />
            </div>
          </div>

          <!-- ===== 黄色角色（右侧矮圆） ===== -->
          <div
            ref="yellowRef"
            class="absolute bottom-0"
            :style="yellowStyle"
          >
            <div
              ref="yellowEyeClusterRef"
              class="absolute flex gap-6"
              :style="{ left: yellowEyeLeft + 'px', top: yellowEyeTop + 'px' }"
            >
              <div
                class="rounded-full"
                :style="{ width: '12px', height: '12px', backgroundColor: '#2D2D2D', transform: `translate(${yellowPupilL.x}px, ${yellowPupilL.y}px)`, transition: 'transform 0.1s ease-out' }"
              />
              <div
                class="rounded-full"
                :style="{ width: '12px', height: '12px', backgroundColor: '#2D2D2D', transform: `translate(${yellowPupilR.x}px, ${yellowPupilR.y}px)`, transition: 'transform 0.1s ease-out' }"
              />
            </div>
            <!-- 嘴部横线 -->
            <div
              class="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full"
              :style="{ left: yellowMouthLeft + 'px', top: yellowMouthTop + 'px' }"
            />
          </div>
        </div>
      </div>

      <!-- 底部链接 -->
      <div class="relative z-20 flex items-center gap-8 text-sm text-white/60">
        <a href="#" class="hover:text-white transition-colors">隐私政策</a>
        <a href="#" class="hover:text-white transition-colors">服务条款</a>
        <a href="#" class="hover:text-white transition-colors">联系我们</a>
      </div>

      <!-- 装饰层 -->
      <div
        class="absolute inset-0"
        style="background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 20px 20px;"
      />
      <div class="absolute top-1/4 right-1/4 size-64 bg-white/10 rounded-full blur-3xl" />
      <div class="absolute bottom-1/4 left-1/4 size-96 bg-white/5 rounded-full blur-3xl" />
    </div>

    <!-- ==================== 右侧：登录表单 ==================== -->
    <div class="flex items-center justify-center p-8 bg-white">
      <div class="w-full max-w-[420px]">
        <!-- 移动端 Logo -->
        <div class="lg:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-12">
          <div class="size-8 rounded-lg bg-[#6C3FF5]/10 flex items-center justify-center">
            <svg class="size-4 text-[#6C3FF5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span>YourBrand</span>
        </div>

        <!-- 标题 -->
        <div class="text-center mb-8">
          <!-- 登录/注册 Tab -->
          <div class="flex justify-center gap-4 mb-6">
            <button
              type="button"
              @click="mode = 'login'"
              class="text-lg font-semibold pb-1 border-b-2 transition-colors"
              :class="mode === 'login' ? 'text-gray-900 border-[#6C3FF5]' : 'text-gray-400 border-transparent hover:text-gray-600'"
            >登录</button>
            <button
              type="button"
              @click="mode = 'register'"
              class="text-lg font-semibold pb-1 border-b-2 transition-colors"
              :class="mode === 'register' ? 'text-gray-900 border-[#6C3FF5]' : 'text-gray-400 border-transparent hover:text-gray-600'"
            >注册</button>
          </div>
          <h1 class="text-3xl font-bold tracking-tight mb-2">
            {{ mode === 'login' ? '欢迎回来' : '创建账号' }}
          </h1>
          <p class="text-gray-500 text-sm">
            {{ mode === 'login' ? '请输入您的邮箱和密码' : '注册以开始使用' }}
          </p>
        </div>

        <!-- 表单 -->
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Email -->
          <div class="space-y-2">
            <label for="email" class="text-sm font-medium block">邮箱</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="anna@gmail.com"
              autocomplete="off"
              @focus="isTyping = true"
              @blur="isTyping = false"
              required
              class="w-full h-12 px-3 rounded-md border border-gray-200 text-sm outline-none
                focus:border-[#6C3FF5] focus:ring-1 focus:ring-[#6C3FF5]/20 transition-colors"
            />
          </div>

          <!-- Password -->
          <div class="space-y-2">
            <label for="password" class="text-sm font-medium block">密码</label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                required
                class="w-full h-12 px-3 pr-10 rounded-md border border-gray-200 text-sm outline-none
                  focus:border-[#6C3FF5] focus:ring-1 focus:ring-[#6C3FF5]/20 transition-colors"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg v-if="showPassword" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="2" y1="2" x2="22" y2="22"/>
                </svg>
                <svg v-else class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- 确认密码（仅注册） -->
          <Transition name="form-field">
            <div v-if="mode === 'register'" class="space-y-2">
              <label for="confirm" class="text-sm font-medium block">确认密码</label>
              <input
                id="confirm"
                v-model="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                class="w-full h-12 px-3 rounded-md border border-gray-200 text-sm outline-none
                  focus:border-[#6C3FF5] focus:ring-1 focus:ring-[#6C3FF5]/20 transition-colors"
              />
            </div>
          </Transition>

          <!-- Remember + Forgot -->
          <div class="flex items-center justify-between">
            <label for="remember" class="flex items-center gap-2 text-sm cursor-pointer select-none">
              <div class="relative">
                <input id="remember" v-model="remember" type="checkbox" class="sr-only" />
                <div
                  class="size-4 rounded border flex items-center justify-center transition-colors"
                  :class="remember ? 'bg-[#6C3FF5] border-[#6C3FF5]' : 'border-gray-300'"
                >
                  <svg v-if="remember" class="size-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
              Remember for 30 days
            </label>
            <a href="#" class="text-sm text-[#6C3FF5] hover:underline font-medium">忘记密码？</a>
          </div>

          <!-- 错误提示 -->
          <Transition name="error">
            <div v-if="error" class="p-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg">
              {{ error }}
            </div>
          </Transition>

          <!-- 提交按钮 -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full h-12 bg-[#6C3FF5] hover:bg-[#5B32D9] text-white text-sm font-medium rounded-md
              transition-colors disabled:opacity-70 disabled:cursor-wait active:scale-[0.98]"
          >
            {{ isLoading ? (mode === 'login' ? '登录中...' : '注册中...') : (mode === 'login' ? '登 录' : '注 册') }}
          </button>
        </form>

        <!-- 登录/注册切换链接 -->
        <div class="text-center text-sm text-gray-500 mt-8">
          <template v-if="mode === 'login'">
            还没有账号？
            <button type="button" @click="mode = 'register'" class="text-gray-800 font-medium hover:underline">立即注册</button>
          </template>
          <template v-else>
            已有账号？
            <button type="button" @click="mode = 'login'" class="text-gray-800 font-medium hover:underline">立即登录</button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { login, register } from '../api/index.js'

const emit = defineEmits(['loginSuccess'])

/* ============ 表单状态 ============ */
const mode = ref('login')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const remember = ref(false)
const showPassword = ref(false)
const isLoading = ref(false)
const error = ref('')
const isTyping = ref(false)
const isLookingAtEachOther = ref(false)
const isPurpleBlinking = ref(false)
const isBlackBlinking = ref(false)
const isPurplePeeking = ref(false)

/* ============ 鼠标 ============ */
const mouse = reactive({ x: 0, y: 0 })
function onMouseMove(e) {
  mouse.x = e.clientX
  mouse.y = e.clientY
}

/* ============ 角色 refs ============ */
const purpleRef = ref(null)
const blackRef = ref(null)
const orangeRef = ref(null)
const yellowRef = ref(null)
const purpleEyeClusterRef = ref(null)
const blackEyeClusterRef = ref(null)
const orangeEyeClusterRef = ref(null)
const yellowEyeClusterRef = ref(null)

/* ============ 角色位置计算 ============ */
function calcFaceSkew(refEl) {
  if (!refEl) return { faceX: 0, faceY: 0, bodySkew: 0 }
  const rect = refEl.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 3
  const dx = mouse.x - cx
  const dy = mouse.y - cy
  return {
    faceX: Math.max(-15, Math.min(15, dx / 20)),
    faceY: Math.max(-10, Math.min(10, dy / 30)),
    bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
  }
}

function calcPupil(eyeCX, eyeCY, maxDist, forceX, forceY) {
  if (forceX !== undefined && forceY !== undefined) {
    return { x: forceX, y: forceY }
  }
  const dx = mouse.x - eyeCX
  const dy = mouse.y - eyeCY
  const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist)
  if (dist < 0.01) return { x: 0, y: 0 }
  const angle = Math.atan2(dy, dx)
  return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }
}

function getEyeCenters(clusterRef, eyeSize, gap) {
  if (!clusterRef) return { lcx: 0, lcy: 0, rcx: 0, rcy: 0 }
  const r = clusterRef.getBoundingClientRect()
  return {
    lcx: r.left + eyeSize / 2,
    lcy: r.top + r.height / 2,
    rcx: r.left + eyeSize + gap + eyeSize / 2,
    rcy: r.top + r.height / 2,
  }
}

/* ============ 角色动态样式 ============ */
const purpleFace = reactive({ x: 0, y: 0, skew: 0 })
const blackFace = reactive({ x: 0, y: 0, skew: 0 })
const orangeFace = reactive({ x: 0, y: 0, skew: 0 })
const yellowFace = reactive({ x: 0, y: 0, skew: 0 })

const purplePupilL = reactive({ x: 0, y: 0 })
const purplePupilR = reactive({ x: 0, y: 0 })
const blackPupilL = reactive({ x: 0, y: 0 })
const blackPupilR = reactive({ x: 0, y: 0 })
const orangePupilL = reactive({ x: 0, y: 0 })
const orangePupilR = reactive({ x: 0, y: 0 })
const yellowPupilL = reactive({ x: 0, y: 0 })
const yellowPupilR = reactive({ x: 0, y: 0 })

const purpleEyeLeft = computed(() => {
  if (password.value.length > 0 && showPassword.value) return 20
  if (isLookingAtEachOther.value) return 55
  return 45 + purpleFace.x
})

const purpleEyeTop = computed(() => {
  if (password.value.length > 0 && showPassword.value) return 35
  if (isLookingAtEachOther.value) return 65
  return 40 + purpleFace.y
})

const purpleEyeStyle = computed(() => ({
  width: '18px',
  height: isPurpleBlinking.value ? '2px' : '18px',
  backgroundColor: 'white',
  overflow: 'hidden',
}))

const purplePupilStyle = computed(() => ({
  width: '7px',
  height: '7px',
  backgroundColor: '#2D2D2D',
  transform: `translate(${purplePupilL.x}px, ${purplePupilL.y}px)`,
  transition: 'transform 0.1s ease-out',
}))

const purplePupilLStyle = computed(() => ({
  width: '7px',
  height: '7px',
  backgroundColor: '#2D2D2D',
  transform: `translate(${purplePupilL.x}px, ${purplePupilL.y}px)`,
  transition: 'transform 0.1s ease-out',
}))

const purplePupilRStyle = computed(() => ({
  width: '7px',
  height: '7px',
  backgroundColor: '#2D2D2D',
  transform: `translate(${purplePupilR.x}px, ${purplePupilR.y}px)`,
  transition: 'transform 0.1s ease-out',
}))

const purpleStyle = computed(() => {
  const hidden = password.value.length > 0 && !showPassword.value
  const extended = isTyping.value || hidden
  let transform = `skewX(${purpleFace.skew}deg)`
  if (password.value.length > 0 && showPassword.value) {
    transform = 'skewX(0deg)'
  } else if (extended) {
    transform = `skewX(${purpleFace.skew - 12}deg) translateX(40px)`
  }
  return {
    left: '70px',
    width: '180px',
    height: extended ? '440px' : '400px',
    backgroundColor: '#8c5cf5',
    borderRadius: '10px 10px 0 0',
    zIndex: 1,
    transition: 'all 0.7s ease-in-out',
    transform,
    transformOrigin: 'bottom center',
  }
})

const blackEyeLeft = computed(() => {
  if (password.value.length > 0 && showPassword.value) return 10
  if (isLookingAtEachOther.value) return 32
  return 26 + blackFace.x
})

const blackEyeTop = computed(() => {
  if (password.value.length > 0 && showPassword.value) return 28
  if (isLookingAtEachOther.value) return 12
  return 32 + blackFace.y
})

const blackStyle = computed(() => {
  let transform = `skewX(${blackFace.skew}deg)`
  if (password.value.length > 0 && showPassword.value) {
    transform = 'skewX(0deg)'
  } else if (isLookingAtEachOther.value) {
    transform = `skewX(${blackFace.skew * 1.5 + 10}deg) translateX(20px)`
  } else if (isTyping.value || (password.value.length > 0 && !showPassword.value)) {
    transform = `skewX(${blackFace.skew * 1.5}deg)`
  }
  return {
    left: '240px',
    width: '120px',
    height: '310px',
    backgroundColor: '#2D2D2D',
    borderRadius: '8px 8px 0 0',
    zIndex: 2,
    transition: 'all 0.7s ease-in-out',
    transform,
    transformOrigin: 'bottom center',
  }
})

const orangeEyeLeft = computed(() => {
  if (password.value.length > 0 && showPassword.value) return 50
  return 82 + orangeFace.x
})

const orangeEyeTop = computed(() => {
  if (password.value.length > 0 && showPassword.value) return 85
  return 90 + orangeFace.y
})

const orangeStyle = computed(() => {
  let transform = `skewX(${orangeFace.skew}deg)`
  if (password.value.length > 0 && showPassword.value) transform = 'skewX(0deg)'
  return {
    left: '0px',
    width: '240px',
    height: '200px',
    zIndex: 3,
    backgroundColor: '#FF9B6B',
    borderRadius: '120px 120px 0 0',
    transition: 'all 0.7s ease-in-out',
    transform,
    transformOrigin: 'bottom center',
  }
})

const yellowEyeLeft = computed(() => {
  if (password.value.length > 0 && showPassword.value) return 20
  return 52 + yellowFace.x
})

const yellowEyeTop = computed(() => {
  if (password.value.length > 0 && showPassword.value) return 35
  return 40 + yellowFace.y
})

const yellowMouthLeft = computed(() => {
  if (password.value.length > 0 && showPassword.value) return 10
  return 40 + yellowFace.x
})

const yellowMouthTop = computed(() => {
  if (password.value.length > 0 && showPassword.value) return 88
  return 88 + yellowFace.y
})

const yellowStyle = computed(() => {
  let transform = `skewX(${yellowFace.skew}deg)`
  if (password.value.length > 0 && showPassword.value) transform = 'skewX(0deg)'
  return {
    left: '310px',
    width: '140px',
    height: '230px',
    backgroundColor: '#E8D754',
    borderRadius: '70px 70px 0 0',
    zIndex: 4,
    transition: 'all 0.7s ease-in-out',
    transform,
    transformOrigin: 'bottom center',
  }
})

/* ============ 主循环 ============ */
let raf = null
function animate() {
  // 面部偏移
  const p = calcFaceSkew(purpleRef.value)
  purpleFace.x = p.faceX; purpleFace.y = p.faceY; purpleFace.skew = p.bodySkew

  const b = calcFaceSkew(blackRef.value)
  blackFace.x = b.faceX; blackFace.y = b.faceY; blackFace.skew = b.bodySkew

  const o = calcFaceSkew(orangeRef.value)
  orangeFace.x = o.faceX; orangeFace.y = o.faceY; orangeFace.skew = o.bodySkew

  const y = calcFaceSkew(yellowRef.value)
  yellowFace.x = y.faceX; yellowFace.y = y.faceY; yellowFace.skew = y.bodySkew

  // 瞳孔位置
  const purpleForce = (password.value.length > 0 && showPassword.value)
    ? { lx: isPurplePeeking.value ? 4 : -4, ly: isPurplePeeking.value ? 5 : -4 }
    : isLookingAtEachOther.value ? { lx: 3, ly: 4 } : { lx: undefined, ly: undefined }

  const pc = getEyeCenters(purpleEyeClusterRef.value, 18, 32)
  const pl = calcPupil(pc.lcx, pc.lcy, 5, purpleForce.lx, purpleForce.ly)
  const pr = calcPupil(pc.rcx, pc.rcy, 5, purpleForce.lx, purpleForce.ly)
  purplePupilL.x = pl.x; purplePupilL.y = pl.y
  purplePupilR.x = pr.x; purplePupilR.y = pr.y

  const blackForce = (password.value.length > 0 && showPassword.value)
    ? { lx: -4, ly: -4 }
    : isLookingAtEachOther.value ? { lx: 0, ly: -4 } : { lx: undefined, ly: undefined }

  const bc = getEyeCenters(blackEyeClusterRef.value, 16, 24)
  const bl = calcPupil(bc.lcx, bc.lcy, 4, blackForce.lx, blackForce.ly)
  const br = calcPupil(bc.rcx, bc.rcy, 4, blackForce.lx, blackForce.ly)
  blackPupilL.x = bl.x; blackPupilL.y = bl.y
  blackPupilR.x = br.x; blackPupilR.y = br.y

  const orangeForce = (password.value.length > 0 && showPassword.value)
    ? { lx: -5, ly: -4 } : { lx: undefined, ly: undefined }

  const oc = getEyeCenters(orangeEyeClusterRef.value, 12, 32)
  const ol = calcPupil(oc.lcx, oc.lcy, 5, orangeForce.lx, orangeForce.ly)
  const or_ = calcPupil(oc.rcx, oc.rcy, 5, orangeForce.lx, orangeForce.ly)
  orangePupilL.x = ol.x; orangePupilL.y = ol.y
  orangePupilR.x = or_.x; orangePupilR.y = or_.y

  const yellowForce = (password.value.length > 0 && showPassword.value)
    ? { lx: -5, ly: -4 } : { lx: undefined, ly: undefined }

  const yc = getEyeCenters(yellowEyeClusterRef.value, 12, 24)
  const yl = calcPupil(yc.lcx, yc.lcy, 5, yellowForce.lx, yellowForce.ly)
  const yr = calcPupil(yc.rcx, yc.rcy, 5, yellowForce.lx, yellowForce.ly)
  yellowPupilL.x = yl.x; yellowPupilL.y = yl.y
  yellowPupilR.x = yr.x; yellowPupilR.y = yr.y

  raf = requestAnimationFrame(animate)
}

/* ============ 眨眼（紫色） ============ */
let purpleBlinkTimer = null
function schedulePurpleBlink() {
  purpleBlinkTimer = setTimeout(() => {
    isPurpleBlinking.value = true
    setTimeout(() => {
      isPurpleBlinking.value = false
      schedulePurpleBlink()
    }, 150)
  }, Math.random() * 4000 + 3000)
}

/* ============ 眨眼（黑色） ============ */
let blackBlinkTimer = null
function scheduleBlackBlink() {
  blackBlinkTimer = setTimeout(() => {
    isBlackBlinking.value = true
    setTimeout(() => {
      isBlackBlinking.value = false
      scheduleBlackBlink()
    }, 150)
  }, Math.random() * 4000 + 3000)
}

/* ============ 打字对望 ============ */
let lookTimer = null
watch(isTyping, (val) => {
  if (val) {
    isLookingAtEachOther.value = true
    if (lookTimer) clearTimeout(lookTimer)
    lookTimer = setTimeout(() => { isLookingAtEachOther.value = false }, 800)
  } else {
    isLookingAtEachOther.value = false
  }
})

/* ============ 密码偷看 ============ */
let peekTimer = null
watch([password, showPassword], ([pwd, show]) => {
  if (peekTimer) clearTimeout(peekTimer)
  if (pwd.length > 0 && show) {
    const schedulePeek = () => {
      const delay = Math.random() * 3000 + 2000
      peekTimer = setTimeout(() => {
        isPurplePeeking.value = true
        setTimeout(() => {
          isPurplePeeking.value = false
          if (pwd.length > 0 && showPassword.value) schedulePeek()
        }, 800)
      }, delay)
    }
    schedulePeek()
  } else {
    isPurplePeeking.value = false
  }
})

/* ============ 登录/注册提交 ============ */
async function handleSubmit() {
  error.value = ''
  isLoading.value = true

  try {
    if (mode.value === 'login') {
      const res = await login(email.value, password.value)
      localStorage.setItem('kds_token', res.data.data.token)
      emit('loginSuccess')
    } else {
      if (password.value !== confirmPassword.value) {
        error.value = '两次密码不一致'
        return
      }
      const res = await register(email.value, password.value)
      localStorage.setItem('kds_token', res.data.data.token)
      emit('loginSuccess')
    }
  } catch (err) {
    error.value = err.response?.data?.msg || '请求失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

/* ============ 生命周期 ============ */
onMounted(() => {
  raf = requestAnimationFrame(animate)
  schedulePurpleBlink()
  scheduleBlackBlink()
})

onUnmounted(() => {
  if (raf) cancelAnimationFrame(raf)
  if (purpleBlinkTimer) clearTimeout(purpleBlinkTimer)
  if (blackBlinkTimer) clearTimeout(blackBlinkTimer)
  if (lookTimer) clearTimeout(lookTimer)
  if (peekTimer) clearTimeout(peekTimer)
})
</script>

<style scoped>
/* ====== 错误 / 表单字段过渡 ====== */
.error-enter-active,
.form-field-enter-active { transition: all 0.3s ease; }
.error-leave-active,
.form-field-leave-active { transition: all 0.2s ease; }
.error-enter-from,
.error-leave-to,
.form-field-enter-from,
.form-field-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
