import { VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'
import './index.css'
import App from './App.vue'
import { queryClient } from './queryClient'

createApp(App).use(VueQueryPlugin, { queryClient }).mount('#root')
