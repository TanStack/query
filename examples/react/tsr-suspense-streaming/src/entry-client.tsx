import { hydrateRoot } from 'react-dom/client'

import { StartClient } from '@tanstack/react-router-server/client'
import { createRouter } from './router'

const router = createRouter()
router.hydrate()

hydrateRoot(document, <StartClient router={router} />)
