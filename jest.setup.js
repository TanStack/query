import { act } from '@testing-library/react'

import { notifyManager } from '@tanstack/query-core'

// Wrap notifications with act to make sure React knows about React Query updates
notifyManager.setNotifyFunction((fn) => {
  act(fn)
})

jest.mock('react', () => {
  const packages = {
    18: 'react',
    17: 'react-17',
  }
  const version = process.env.REACTJS_VERSION || '18'

  return jest.requireActual(packages[version])
})

jest.mock('react-dom', () => {
  const packages = {
    18: 'react-dom',
    17: 'react-dom-17',
  }
  const version = process.env.REACTJS_VERSION || '18'

  return jest.requireActual(packages[version])
})

jest.mock('@testing-library/react', () => {
  const packages = {
    18: '@testing-library/react',
    17: '@testing-library/react-17',
  }
  const version = process.env.REACTJS_VERSION || '18'

  return jest.requireActual(packages[version])
})
