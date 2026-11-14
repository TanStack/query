// @refresh reload
import { StartClient, mount } from '@solidjs/start/client'

const app = document.getElementById('app')
if (!app) throw new Error('Missing #app element')

mount(() => <StartClient />, app)
