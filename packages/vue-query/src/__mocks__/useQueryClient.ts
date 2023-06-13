import { QueryClient } from '../queryClient'
import { noop } from '../utils'

const queryClient = new QueryClient({
  logger: {
    ...console,
    error: noop,
  },
  defaultOptions: {
    queries: { retry: false, cacheTime: Infinity },
  },
})

export const useQueryClient = jest.fn(() => queryClient)
