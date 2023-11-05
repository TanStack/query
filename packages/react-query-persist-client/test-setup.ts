import '@testing-library/jest-dom/vitest'
import { act, cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { notifyManager } from '@tanstack/react-query'

// https://testing-library.com/docs/react-testing-library/api#cleanup
afterEach(() => cleanup())

// Wrap notifications with act to make sure React knows about React Query updates
notifyManager.setNotifyFunction((fn) => {
  act(fn)
})
