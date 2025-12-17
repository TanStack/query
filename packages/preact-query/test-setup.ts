import '@testing-library/jest-dom/vitest'
import { act, cleanup as cleanupRTL } from '@testing-library/preact'
import { cleanup as cleanupRRS } from '@testing-library/react-render-stream'
import { afterEach } from 'vitest'
import { notifyManager } from '@tanstack/query-core'

// https://testing-library.com/docs/react-testing-library/api#cleanup
afterEach(() => {
  cleanupRTL()
  cleanupRRS()
})

// Wrap notifications with act to make sure React knows about React Query updates
notifyManager.setNotifyFunction((fn) => {
  act(fn)
})
