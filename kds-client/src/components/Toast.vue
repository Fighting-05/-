<template>
  <Transition name="toast">
    <div v-if="show" class="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl text-sm font-medium shadow-lg" :class="type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'">
      {{ msg }}
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({ message: String, type: { type: String, default: 'success' } })
const show = ref(false)
const msg = ref('')

let timer = null

watch(() => props.message, (val) => {
  if (!val) return
  msg.value = val
  show.value = true
  clearTimeout(timer)
  timer = setTimeout(() => { show.value = false }, 2500)
})
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-12px); }
</style>
