import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const target = document.querySelector('#app')
if (!target) throw new Error('Missing #app element')

const app = mount(App, { target })

export default app
