import { vi } from 'vitest'
import { QueryClient } from '../queryClient'
import type { Mock } from 'vitest'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, gcTime: Infinity },
  },
})

export const useQueryClient: Mock<[], QueryClient> = vi.fn(() => queryClient)
