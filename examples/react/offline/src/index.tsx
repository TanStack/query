import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { worker } from './api'

worker.start()

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')
ReactDOM.createRoot(rootElement).render(
  <div style={{ padding: '16px' }}>
    <App />
  </div>,
)
