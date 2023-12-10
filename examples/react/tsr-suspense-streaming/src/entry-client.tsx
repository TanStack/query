import * as React from 'react'
import ReactDOM from 'react-dom/client'

import { StartClient } from '@tanstack/react-router-server/client'
import { createRouter } from './router'

const router = createRouter()
router.hydrate()

ReactDOM.hydrateRoot(document, <StartClient router={router} />)
