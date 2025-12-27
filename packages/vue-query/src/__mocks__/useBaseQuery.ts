import { vi } from 'vitest'
import type { Mock } from 'vitest'

const { useBaseQuery: originImpl } = (await vi.importActual(
  '../useBaseQuery',
)) as any

export const useBaseQuery: Mock<(...args: Array<any>) => any> =
  vi.fn(originImpl)
