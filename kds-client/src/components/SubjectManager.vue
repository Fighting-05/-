<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-serif text-[#3d3226]">科目管理</h2>
      <button @click="showForm = !showForm" class="px-4 py-2 bg-[#5c4a32] text-[#f7f7f5] rounded-xl text-sm hover:bg-[#3d3226] transition-colors">
        + 添加科目
      </button>
    </div>

    <Transition name="slide">
      <div v-if="showForm" class="bg-white rounded-2xl p-6 border border-[#e8e0d5] shadow-sm">
        <div class="flex gap-3 items-end">
          <div class="flex-1">
            <label class="block text-xs text-[#8c7a60] font-medium mb-1.5">科目名称</label>
            <input v-model="form.name" type="text" placeholder="如：高等数学" class="w-full p-3 border border-[#e8e0d5] rounded-xl text-sm bg-[#fdfaf5] outline-none focus:border-[#c4a882]" />
          </div>
          <div>
            <label class="block text-xs text-[#8c7a60] font-medium mb-1.5">颜色</label>
            <input v-model="form.color" type="color" class="w-12 h-11 rounded-xl border border-[#e8e0d5] cursor-pointer" />
          </div>
          <button @click="add" :disabled="!form.name" class="px-6 py-3 bg-[#5c4a32] text-white rounded-xl text-sm font-medium hover:bg-[#3d3226] disabled:opacity-30 transition-colors">
            添加
          </button>
        </div>
      </div>
    </Transition>

    <div v-if="subjects.length === 0" class="text-center py-20 text-[#c4b8a0] text-sm">
      暂无科目，请先添加
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div v-for="s in subjects" :key="s.id"
        class="bg-white rounded-2xl border border-[#e8e0d5] p-5 shadow-sm flex items-center justify-between
               hover:shadow-md hover:-translate-y-0.5 transition-all duration-500 ease-out"
      >
        <div class="flex items-center gap-3">
          <span class="w-4 h-4 rounded-full inline-block" :style="{ background: s.color }"></span>
          <span class="text-sm font-medium text-[#3d3226]">{{ s.name }}</span>
        </div>
        <button @click="remove(s.id)" class="text-[#d4b8a0] hover:text-red-400 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getSubjects, createSubject, deleteSubject } from '../api/index.js'

const emit = defineEmits(['toast'])
const subjects = ref([])
const showForm = ref(false)
const form = reactive({ name: '', color: '#6366f1' })

async function load() {
  try { const res = await getSubjects(); subjects.value = res.data.data } catch (e) { /* */ }
}

async function add() {
  if (!form.name) return
  try { await createSubject({ name: form.name, color: form.color }); showForm.value = false; form.name = ''; await load() } catch (e) { /* */ }
}

async function remove(id) {
  if (!confirm('删除科目？')) return
  try { await deleteSubject(id); await load() } catch (e) { /* */ }
}

onMounted(load)
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
