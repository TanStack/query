import ReactDOM from 'react-dom/client'
import App from './App'
import { worker } from './mocks'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')

worker.start().then(() => {
  ReactDOM.createRoot(rootElement).render(
    <div style={{ padding: '16px' }}>
      <App />
    </div>,
  )
})
