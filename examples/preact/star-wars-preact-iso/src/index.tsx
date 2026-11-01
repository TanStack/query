import { render } from 'preact'
import App from './App'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')
render(<App />, rootElement)
