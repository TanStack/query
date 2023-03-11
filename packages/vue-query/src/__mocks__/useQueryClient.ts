import { QueryClient } from '../queryClient'
import { vi } from 'vitest'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, gcTime: Infinity },
  },
})

export const useQueryClient = vi.fn(() => queryClient)
