import { tanstackRouter } from '@tanstack/router-plugin/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tanstackRouter({ target: 'vue', autoCodeSplitting: true }), vue()],
  optimizeDeps: {
    exclude: ['@tanstack/vue-query', 'vue-demi'],
  },
})
