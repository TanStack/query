import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import './index.css'

import App from './App.vue'
import { queryClient } from './queryClient'

createApp(App).use(VueQueryPlugin, { queryClient }).mount('#root')
