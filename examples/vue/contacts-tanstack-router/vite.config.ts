import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [tanstackRouter({ target: 'vue', autoCodeSplitting: true }), vue()],
  optimizeDeps: {
    exclude: ['@tanstack/vue-query', 'vue-demi'],
  },
})
