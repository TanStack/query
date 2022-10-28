import { render } from 'solid-js/web'

import { App } from './App'
import { Router } from "@solidjs/router";

import { worker } from "./api"

const app = () => (
  <Router>
    <App />
  </Router>
)

worker.start()

render(app, document.getElementById('root') as HTMLElement)
