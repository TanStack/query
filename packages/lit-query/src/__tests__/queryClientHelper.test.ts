import { vi } from 'vitest'
import {
  QUERY_CLIENT_ID,
  getQueryClient,
  setQueryClient,
} from './../queryClientHelper'
import type { QueryClient } from '@tanstack/query-core'

const mockQueryClient = {
  mount: vi.fn(),
  unmount: vi.fn(),
} as unknown as QueryClient

const cleanWindow = () => {
  delete window[QUERY_CLIENT_ID]
}

describe('queryClientHelper', () => {
  afterEach(cleanWindow)

  it('should set and get the query client', () => {
    setQueryClient(mockQueryClient)

    const queryClient = getQueryClient()

    expect(queryClient).toBe(mockQueryClient)
  })

  it('should throw if query client is not set and trying to retrieve', () => {
    expect(() => {
      getQueryClient()
    }).toThrow('QueryClient is not set')
  })

  it('should mount the query client when mountQueryClient', () => {
    setQueryClient(mockQueryClient)

    getQueryClient().mount()

    expect(mockQueryClient.mount).toHaveBeenCalled()
  })

  it('should unmount the query client when unmountQueryClient', () => {
    setQueryClient(mockQueryClient)

    getQueryClient().unmount()

    expect(mockQueryClient.unmount).toHaveBeenCalled()
  })
})
