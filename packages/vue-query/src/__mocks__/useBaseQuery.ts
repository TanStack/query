import { vi } from 'vitest'
import type { Mock } from 'vitest'

const { useBaseQuery: originImpl, unrefQueryArgs: originalParse } =
  // @ts-expect-error - vitest uses esmodules; tsconfig is not set to use them
  (await vi.importActual('../useBaseQuery')) as any

export const useBaseQuery: Mock<Array<any>, any> = vi.fn(originImpl)
export const unrefQueryArgs = originalParse
