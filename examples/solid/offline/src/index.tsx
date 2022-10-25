import { render } from 'solid-js/web'

import { App } from './App'
import { Router } from "@solidjs/router";

const app = () => (
  <Router>
    <App />
  </Router>
)

render(app, document.getElementById('root') as HTMLElement)
