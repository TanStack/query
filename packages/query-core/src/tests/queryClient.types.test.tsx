import { doNotExecute, queryKey } from './utils'
import type { QueryClient } from '..'

describe('queryClient', () => {
  let queryClient: QueryClient

  it('should be used with queryCache', () => {
    doNotExecute(() => {
      queryClient.getQueryData(queryKey())
      queryClient.getQueryData(queryKey(), {})
    })
  })
})
