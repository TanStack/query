import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import './styles.css'

import App from './App.vue'

createApp(App).use(VueQueryPlugin).mount('#app')
