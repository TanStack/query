import { VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'
import './index.css'
import App from './App.vue'

const appRoot = document.getElementById('app')
if (!appRoot) throw new Error('Missing #app element')

const shadowRoot = appRoot.attachShadow({ mode: 'open' })
const container = shadowRoot.appendChild(document.createElement('div'))

createApp(App, { shadowRoot }).use(VueQueryPlugin).mount(container)
