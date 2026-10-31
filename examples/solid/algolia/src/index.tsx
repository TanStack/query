/* @refresh reload */
import { render } from 'solid-js/web'

import App from './App'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')
render(() => <App />, rootElement)
