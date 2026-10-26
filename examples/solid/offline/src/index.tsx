/* @refresh reload */
import { render } from 'solid-js/web'
import App from './App'
import { worker } from './mocks'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

worker.start().then(() => {
  render(
    () => (
      <div style={{ padding: '16px' }}>
        <App />
      </div>
    ),
    root,
  )
})
