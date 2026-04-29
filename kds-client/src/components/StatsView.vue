<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-serif text-[#3d3226]">{{ year }}年{{ month }}月 · 统计</h2>

    <!-- 科目完成率 -->
    <div class="bg-white rounded-2xl border border-[#e8e0d5] p-6 shadow-sm">
      <h3 class="text-sm font-medium text-[#5c4a32] mb-4">科目完成情况</h3>
      <div v-if="stats.subjects?.length">
        <div v-for="s in stats.subjects" :key="s.id" class="mb-4 last:mb-0">
          <div class="flex justify-between text-xs mb-1.5">
            <span class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full inline-block" :style="{ background: s.color }"></span>
              {{ s.name }}
            </span>
            <span class="text-[#a6967c]">{{ s.actual }}h / {{ s.planned }}h</span>
          </div>
          <div class="h-2.5 bg-[#f0e8d8] rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-700" :style="{ width: pct(s) + '%', background: s.color }"></div>
          </div>
        </div>
      </div>

      <!-- 最拖延科目 -->
      <div v-if="stats.worstSubject && stats.worstSubject.planned > 0" class="mt-6 p-4 bg-[#fdf0ed] border border-[#e8c4b8] rounded-2xl">
        <p class="text-sm font-medium text-[#a0523d]">⚠ 最拖延科目</p>
        <p class="text-xs text-[#c4907a] mt-1">
          {{ stats.worstSubject.name }}：完成率仅 {{ Math.round(stats.worstSubject.pct * 100) }}%
          （{{ stats.worstSubject.actual }}h / {{ stats.worstSubject.planned }}h）
        </p>
      </div>
    </div>

    <!-- 热力图 -->
    <div class="bg-white rounded-2xl border border-[#e8e0d5] p-6 shadow-sm">
      <h3 class="text-sm font-medium text-[#5c4a32] mb-4">每日热力图（基于完成率）</h3>
      <div class="flex items-center gap-2 mb-3 justify-end">
        <span class="text-[10px] text-[#b8a890]">低</span>
        <span class="w-3 h-3 rounded-sm" style="background:#f0e8d8"></span>
        <span class="w-3 h-3 rounded-sm" style="background:#e8d4a8"></span>
        <span class="w-3 h-3 rounded-sm" style="background:#d4c080"></span>
        <span class="w-3 h-3 rounded-sm" style="background:#9ec49e"></span>
        <span class="w-3 h-3 rounded-sm" style="background:#5a9e3f"></span>
        <span class="text-[10px] text-[#b8a890]">高</span>
        <span class="text-[10px] text-[#b8a890] ml-2">(完成率)</span>
      </div>
      <div class="grid grid-cols-7 gap-1.5">
        <!-- Day headers -->
        <span v-for="d in ['一','二','三','四','五','六','日']" :key="d" class="text-[9px] text-[#b8a890] text-center">{{ d }}</span>
        <div v-for="(day, i) in heatmap" :key="i" class="aspect-square rounded-sm cursor-default relative group"
          :style="{ background: heatColor(day.ratio) }"
          :title="`${day.date}: ${day.hours}h`">
          <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-[#3d3226] text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {{ day.date.slice(5) }}: {{ day.hours }}h ({{ Math.round(day.ratio * 100) }}%)
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { getMonthlyStats, getMonthHeatmap } from '../api/index.js'

const props = defineProps({ year: Number, month: Number })
const stats = ref({ subjects: [], worstSubject: null })
const heatmap = ref([])

function pct(s) { return s.planned > 0 ? Math.min(100, Math.round((s.actual / s.planned) * 100)) : 0 }

function heatColor(ratio) {
  if (ratio <= 0) return '#f0e8d8'
  if (ratio < 0.3) return '#e8d4a8'
  if (ratio < 0.6) return '#d4c080'
  if (ratio < 0.8) return '#9ec49e'
  return '#5a9e3f'
}

async function load() {
  try {
    const [statsRes, heatRes] = await Promise.all([
      getMonthlyStats(props.year, props.month),
      getMonthHeatmap(props.year, props.month)
    ])
    stats.value = statsRes.data.data
    heatmap.value = heatRes.data.data
  } catch (e) { /* */ }
}

watch(() => [props.year, props.month], load, { immediate: true })
</script>
