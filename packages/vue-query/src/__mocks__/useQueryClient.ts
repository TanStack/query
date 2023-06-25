import { QueryClient } from '../queryClient'

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

export const useQueryClient = jest.fn(() => queryClient)
