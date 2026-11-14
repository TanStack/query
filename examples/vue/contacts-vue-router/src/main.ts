import { VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'
import './index.css'
import App from './App.vue'
import { queryClient } from './queryClient'
import { router } from './router'

createApp(App).use(router).use(VueQueryPlugin, { queryClient }).mount('#root')
