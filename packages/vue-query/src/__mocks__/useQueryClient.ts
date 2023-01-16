import { QueryClient } from '../queryClient'

const queryClient = new QueryClient({
  logger: {
    ...console,
    error: () => {
      // Noop
    },
  },
  defaultOptions: {
    queries: { retry: false, gcTime: Infinity },
  },
})

export const useQueryClient = jest.fn(() => queryClient)
