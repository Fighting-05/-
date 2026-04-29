<template>
  <nav class="fixed left-0 top-0 bottom-0 w-16 flex flex-col items-center py-8 gap-2 z-40">
    <div class="text-2xl mb-6 select-none">📖</div>

    <button v-for="tab in tabs" :key="tab.key"
      @click="$emit('navigate', tab.key)"
      class="bookmark w-12 h-12 flex items-center justify-center rounded-r-xl transition-all duration-300 group relative"
      :class="active === tab.key ? 'bg-[#e8dcc8] text-[#5c4a32] shadow-sm' : 'text-[#b8a890] hover:text-[#7a6a52]'"
      :title="tab.label"
    >
      <span class="text-lg">{{ tab.icon }}</span>
      <span class="absolute left-14 bg-[#3d3226] text-[#f5f0e8] text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {{ tab.label }}
      </span>
    </button>

    <div class="mt-auto flex flex-col items-center gap-3">
      <button @click="$emit('logout')"
        class="text-[#c4b8a0] hover:text-[#a0523d] text-xs transition-colors"
        title="退出登录"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
      <div class="text-xs text-[#c4b8a0] select-none" title="当前月份">
        <span class="block text-center">{{ currentMonth }}月</span>
      </div>
    </div>
  </nav>
</template>

<script setup>
defineProps({ active: String })
const emit = defineEmits(['navigate', 'logout'])

const currentMonth = new Date().getMonth() + 1

const tabs = [
  { key: 'month', label: '月计划', icon: '📅' },
  { key: 'week', label: '周执行', icon: '📋' },
  { key: 'day', label: '日记录', icon: '✍️' },
  { key: 'stats', label: '统计', icon: '📊' },
  { key: 'subjects', label: '科目', icon: '📚' },
  { key: 'tasks', label: '考研任务', icon: '📝' },
]
</script>

<style scoped>
.bookmark {
  cursor: pointer;
  border: none;
  background: transparent;
  font-family: inherit;
}

.bookmark::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: currentColor;
  opacity: 0;
  transition: opacity 0.3s;
}

.bookmark.active::before,
.bookmark:hover::before {
  opacity: 1;
}
</style>
