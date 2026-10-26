import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hasInjectionContext, inject } from 'vue-demi'
import { useQueryClient } from '../useQueryClient'
import { VUE_QUERY_CLIENT } from '../utils'

vi.mock(import('vue-demi'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // oxlint-disable-next-line vitest/require-mock-type-parameters -- 'Mock' keeps only the last overload, so it cannot type the overloaded generic 'inject'
    inject: vi.fn(),
    hasInjectionContext: vi.fn<() => boolean>(() => true),
  }
})

describe('useQueryClient', () => {
  const injectSpy = vi.mocked(inject)
  const hasInjectionContextSpy = vi.mocked(hasInjectionContext)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return queryClient when it is provided in the context', () => {
    const queryClientMock = { name: 'Mocked client' }
    injectSpy.mockReturnValueOnce(queryClientMock)

    const queryClient = useQueryClient()

    expect(queryClient).toStrictEqual(queryClientMock)
    expect(injectSpy).toHaveBeenCalledTimes(1)
    expect(injectSpy).toHaveBeenCalledWith(VUE_QUERY_CLIENT)
  })

  it('should throw an error when queryClient does not exist in the context', () => {
    injectSpy.mockReturnValueOnce(undefined)

    expect(useQueryClient).toThrow(
      "No 'queryClient' found in Vue context, use 'VueQueryPlugin' to properly initialize the library.",
    )
    expect(injectSpy).toHaveBeenCalledTimes(1)
    expect(injectSpy).toHaveBeenCalledWith(VUE_QUERY_CLIENT)
  })

  it('should throw an error when used outside of setup function', () => {
    hasInjectionContextSpy.mockReturnValueOnce(false)

    expect(useQueryClient).toThrow(
      'vue-query hooks can only be used inside setup() function or functions that support injection context.',
    )
    expect(hasInjectionContextSpy).toHaveBeenCalledTimes(1)
  })

  it('should call inject with a custom key as a suffix', () => {
    const queryClientKey = 'foo'
    const expectedKeyParameter = `${VUE_QUERY_CLIENT}:${queryClientKey}`
    const queryClientMock = { name: 'Mocked client' }
    injectSpy.mockReturnValueOnce(queryClientMock)

    useQueryClient(queryClientKey)

    expect(injectSpy).toHaveBeenCalledWith(expectedKeyParameter)
  })
})
