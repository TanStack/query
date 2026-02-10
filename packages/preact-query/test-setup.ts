import { notifyManager } from '@tanstack/query-core'
import '@testing-library/jest-dom/vitest'
import { act, cleanup as cleanupRTL } from '@testing-library/preact'
import { afterEach } from 'vitest'

// https://testing-library.com/docs/preact-testing-library/api#cleanup
afterEach(() => {
  cleanupRTL()
})

// Wrap notifications with act to make sure React knows about React Query updates
notifyManager.setNotifyFunction((fn) => {
  act(fn)
})
