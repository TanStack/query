import { QueryClient } from '../queryClient'
import { vi } from 'vitest'

const queryClient = new QueryClient({
  logger: {
    ...console,
    error: () => {
      // Noop
    },
  },
  defaultOptions: {
    queries: { retry: false, cacheTime: Infinity },
  },
})

export const useQueryClient = vi.fn(() => queryClient)
