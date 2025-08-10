import { act } from '@testing-library/react'
import { notifyManager } from '@tanstack/query-core'

// Wrap notifications with act to make sure React knows about React Query updates
notifyManager.setNotifyFunction(act)

type ReactVersion = '19' | '18' | '17'

jest.mock('react', () => {
  const packages = {
    '19': 'react',
    '18': 'react-18',
    '17': 'react-17',
  }
  const version = (process.env.REACTJS_VERSION || '19') as ReactVersion

  return jest.requireActual(packages[version]!)
})

jest.mock('react-dom', () => {
  const packages = {
    '19': 'react-dom',
    '18': 'react-dom-18',
    '17': 'react-dom-17',
  }
  const version = (process.env.REACTJS_VERSION || '19') as ReactVersion

  return jest.requireActual(packages[version])
})

jest.mock('@testing-library/react', () => {
  const packages = {
    '19': '@testing-library/react',
    '18': '@testing-library/react-18',
    '17': '@testing-library/react-17',
  }
  const version = (process.env.REACTJS_VERSION || '19') as ReactVersion

  return jest.requireActual(packages[version])
})
