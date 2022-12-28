import { QueryClient } from '../queryClient'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, cacheTime: Infinity },
  },
})

export const useQueryClient = jest.fn(() => queryClient)
