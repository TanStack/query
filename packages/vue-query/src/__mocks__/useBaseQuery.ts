import { vi } from 'vitest'
import type { Mock } from 'vitest'

const { useBaseQuery: originImpl, unrefQueryArgs: originalParse } =
  (await vi.importActual('../useBaseQuery')) as any

export const useBaseQuery: Mock<(...args: Array<any>) => any> =
  vi.fn(originImpl)
export const unrefQueryArgs = originalParse
