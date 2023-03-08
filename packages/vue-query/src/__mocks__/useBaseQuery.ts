import { vi } from 'vitest'

const { useBaseQuery: originImpl, unrefQueryArgs: originalParse } =
  (await vi.importActual('../useBaseQuery')) as any

export const useBaseQuery = vi.fn(originImpl)
export const unrefQueryArgs = originalParse
