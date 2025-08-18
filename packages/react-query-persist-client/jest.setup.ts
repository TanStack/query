import { act, cleanup as cleanupRTL } from '@testing-library/react'
import { notifyManager } from '@tanstack/query-core'
import { unstable_batchedUpdates } from 'react-dom'

// https://testing-library.com/docs/react-testing-library/api#cleanup
afterEach(() => {
  cleanupRTL()
})

// Wrap notifications with act to make sure React knows about React Query updates
const reactVersion = process.env.REACTJS_VERSION || '19'
notifyManager.setNotifyFunction((fn) => {
  if (reactVersion === '19') {
    unstable_batchedUpdates(fn)
  } else {
    act(fn)
  }
})
