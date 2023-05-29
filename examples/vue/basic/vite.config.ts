import { defineConfig } from 'vite'
import createVuePlugin from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [createVuePlugin()],
  optimizeDeps: {
    exclude: ['@tanstack/vue-query', 'vue-demi'],
  },
})
