import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss(), vue()],
  optimizeDeps: {
    exclude: ['@tanstack/vue-query', 'vue-demi'],
  },
})
