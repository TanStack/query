import { mount } from 'svelte'
import './index.css'
import App from './App.svelte'

const appRoot = document.querySelector('#app')
if (!appRoot) throw new Error('Missing #app element')

const shadowRoot = appRoot.attachShadow({ mode: 'open' })
const app = mount(App, { target: shadowRoot, props: { shadowRoot } })

export default app
