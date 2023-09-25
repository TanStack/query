import { act } from '@testing-library/react'
import { notifyManager } from '@tanstack/query-core'

// Wrap notifications with act to make sure React knows about React Query updates
notifyManager.setNotifyFunction((fn) => {
  act(fn)
})
