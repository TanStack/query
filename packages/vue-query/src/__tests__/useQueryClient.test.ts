import { beforeEach, describe, expect, test, vi } from 'vitest'
import { hasInjectionContext, inject } from 'vue-demi'
import { useQueryClient } from '../useQueryClient'
import { VUE_QUERY_CLIENT } from '../utils'
import type { Mock } from 'vitest'

describe('useQueryClient', () => {
  const injectSpy = inject as Mock
  const hasInjectionContextSpy = hasInjectionContext as Mock

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  test('should return queryClient when it is provided in the context', () => {
    const queryClientMock = { name: 'Mocked client' }
    injectSpy.mockReturnValueOnce(queryClientMock)

    const queryClient = useQueryClient()

    expect(queryClient).toStrictEqual(queryClientMock)
    expect(injectSpy).toHaveBeenCalledTimes(1)
    expect(injectSpy).toHaveBeenCalledWith(VUE_QUERY_CLIENT)
  })

  test('should throw an error when queryClient does not exist in the context', () => {
    injectSpy.mockReturnValueOnce(undefined)

    expect(useQueryClient).toThrowError()
    expect(injectSpy).toHaveBeenCalledTimes(1)
    expect(injectSpy).toHaveBeenCalledWith(VUE_QUERY_CLIENT)
  })

  test('should throw an error when used outside of setup function', () => {
    hasInjectionContextSpy.mockReturnValueOnce(false)

    expect(useQueryClient).toThrowError()
    expect(hasInjectionContextSpy).toHaveBeenCalledTimes(1)
  })

  test('should call inject with a custom key as a suffix', () => {
    const queryClientKey = 'foo'
    const expectedKeyParameter = `${VUE_QUERY_CLIENT}:${queryClientKey}`
    const queryClientMock = { name: 'Mocked client' }
    injectSpy.mockReturnValueOnce(queryClientMock)

    useQueryClient(queryClientKey)

    expect(injectSpy).toHaveBeenCalledWith(expectedKeyParameter)
  })
})
