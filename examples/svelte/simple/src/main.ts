import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.querySelector('#app')!,
})

export default app
