import { act } from '@testing-library/react'

import { setUpdateFn } from './src'

// Wrap updates with act to make sure React knows about React Query updates
setUpdateFn(fn => {
  act(fn)
})
