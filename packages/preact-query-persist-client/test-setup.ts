import '@testing-library/jest-dom/vitest'
import { act, cleanup as cleanupRTL } from '@testing-library/preact'
import { afterEach } from 'vitest'
import { notifyManager } from '@tanstack/preact-query'

// https://testing-library.com/docs/preact-testing-library/api#cleanup
afterEach(() => {
  cleanupRTL()
})

// Wrap notifications with act to make sure Preact knows about Query updates
notifyManager.setNotifyFunction((fn) => {
  act(fn)
})
