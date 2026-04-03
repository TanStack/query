import '@testing-library/jest-dom/vitest'
import { act, cleanup as cleanupRTL } from '@testing-library/react'
import { afterEach } from 'vitest'
import { notifyManager } from '@tanstack/query-core'

// https://testing-library.com/docs/react-testing-library/api#cleanup
afterEach(() => {
  cleanupRTL()
})

// Wrap notifications with act to make sure React knows about React Query updates
notifyManager.setNotifyFunction((fn) => {
  act(fn)
})
