import { vi } from 'vitest'
import type * as UseBaseQueryModule from '../useBaseQuery'

const { useBaseQuery: originImpl } =
  await vi.importActual<typeof UseBaseQueryModule>('../useBaseQuery')

export const useBaseQuery = vi.fn(originImpl)
