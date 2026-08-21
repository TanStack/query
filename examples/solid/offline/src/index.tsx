/* @refresh reload */
import { render } from 'solid-js/web'
import App from './App'
import { worker } from './api'

worker.start()

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

render(
  () => (
    <div style={{ padding: '16px' }}>
      <App />
    </div>
  ),
  root,
)
