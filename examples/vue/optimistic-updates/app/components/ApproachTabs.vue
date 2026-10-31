<script setup lang="ts">
import { ref } from 'vue'
import TodoListUI from './TodoListUI.vue'
import TodoListCache from './TodoListCache.vue'
import type { CSSProperties } from 'vue'

type Tab = 'ui-variables' | 'cache'

const activeTab = ref<Tab>('ui-variables')

const tabStyle = (tab: Tab): CSSProperties => ({
  padding: '0.5rem 1rem',
  border: 'none',
  borderBottom:
    activeTab.value === tab ? '2px solid #0070f3' : '2px solid transparent',
  background: 'none',
  cursor: 'pointer',
  fontWeight: activeTab.value === tab ? 600 : 400,
  color: activeTab.value === tab ? '#0070f3' : '#555',
})
</script>

<template>
  <div>
    <div
      style="
        display: flex;
        border-bottom: 1px solid #ddd;
        margin-bottom: 1.5rem;
      "
    >
      <button
        :style="tabStyle('ui-variables')"
        @click="activeTab = 'ui-variables'"
      >
        Via UI Variables
      </button>
      <button :style="tabStyle('cache')" @click="activeTab = 'cache'">
        Via Cache Manipulation
      </button>
    </div>

    <TodoListUI v-if="activeTab === 'ui-variables'" />
    <TodoListCache v-else />
  </div>
</template>
