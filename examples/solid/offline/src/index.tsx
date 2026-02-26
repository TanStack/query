/* @refresh reload */
import { render } from 'solid-js/web'
import App from './App'
import { worker } from './api'

worker.start()

render(
  () => (
    <div style={{ padding: '16px' }}>
      <App />
    </div>
  ),
  document.getElementById('root')!,
)
