import { vi } from 'vitest'

const { useBaseQuery: originImpl, parseQueryArgs: originalParse } =
  (await vi.importActual('../useBaseQuery')) as any

export const useBaseQuery = vi.fn(originImpl)
export const parseQueryArgs = originalParse
