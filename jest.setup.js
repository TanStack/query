import { act } from '@testing-library/react'

import { setNotifyFn } from './src'

// Wrap notifications with act to make sure React knows about React Query updates
setNotifyFn(fn => {
  act(fn)
})
