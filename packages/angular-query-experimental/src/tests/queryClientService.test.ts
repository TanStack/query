import { TestBed } from '@angular/core/testing'
import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, vi } from 'vitest'
import { QUERY_CLIENT } from '../queryClient'
import { QueryClientService } from '../QueryClientService'

class QueryClientMock {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  mount() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  unmount() {}
}

describe('QueryClientService', () => {
  let queryClientService: QueryClientService
  const queryClient = new QueryClientMock()
  const spy = vi.spyOn(queryClient, 'mount')

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: QUERY_CLIENT,
          useValue: queryClient,
        },
        QueryClientService,
      ],
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should mount query client', () => {
    expect(spy).not.toHaveBeenCalled()
    queryClientService = TestBed.inject(QueryClientService)
    const useQueryClient = queryClientService.useQueryClient()
    expect(useQueryClient).toBe(queryClient)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('when passing a queryclient as parameter, useQueryClient should return it', () => {
    const queryClient2 = new QueryClient()
    queryClientService = TestBed.inject(QueryClientService)
    const useQueryClient = queryClientService.useQueryClient(queryClient2)
    expect(useQueryClient).not.toBe(queryClient)
    expect(useQueryClient).toBe(queryClient2)
  })

  describe('when no query client is provided', () => {
    beforeEach(() => {
      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [QueryClientService],
      })
    })

    it('should throw an error', () => {
      queryClientService = TestBed.inject(QueryClientService)
      expect(() => queryClientService.useQueryClient()).toThrowError(
        'No query client found. Make sure to call provideAngularQuery',
      )
    })

    it('should not throw an error if query client is provided as parameter', () => {
      queryClientService = TestBed.inject(QueryClientService)
      expect(() =>
        queryClientService.useQueryClient(new QueryClient()),
      ).not.toThrowError()
    })
  })
})
