import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, vi } from 'vitest'
import { QUERY_CLIENT } from '../injectQueryClient'
import { QueryClientMounter } from '../queryClientMounter'

class QueryClientMock {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  mount() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  unmount() {}
}

describe('QueryClientMounter', () => {
  const queryClient = new QueryClientMock()
  const mountSpy = vi.spyOn(queryClient, 'mount')

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: QUERY_CLIENT,
          useValue: queryClient,
        },
        QueryClientMounter,
      ],
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should mount query client', () => {
    expect(mountSpy).toHaveBeenCalledTimes(0)
    TestBed.inject(QueryClientMounter)
    expect(mountSpy).toHaveBeenCalledTimes(1)
  })
})
