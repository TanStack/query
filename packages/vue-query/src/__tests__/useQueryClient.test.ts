import { getCurrentInstance, inject } from 'vue-demi'
import { useQueryClient } from '../useQueryClient'
import { VUE_QUERY_CLIENT } from '../utils'

describe('useQueryClient', () => {
  const injectSpy = inject as jest.Mock
  const getCurrentInstanceSpy = getCurrentInstance as jest.Mock

  beforeEach(() => {
    jest.restoreAllMocks()
  })

  test('should return queryClient when it is provided in the context', () => {
    const queryClientMock = { name: 'Mocked client' }
    injectSpy.mockReturnValueOnce(queryClientMock)

    const queryClient = useQueryClient()

    expect(queryClient).toStrictEqual(queryClientMock)
    expect(injectSpy).toHaveBeenCalledTimes(1)
    expect(injectSpy).toHaveBeenCalledWith(VUE_QUERY_CLIENT, null)
  })

  test('should throw an error when queryClient does not exist in the context', () => {
    injectSpy.mockReturnValueOnce(undefined)

    expect(useQueryClient).toThrowError()
    expect(injectSpy).toHaveBeenCalledTimes(1)
    expect(injectSpy).toHaveBeenCalledWith(VUE_QUERY_CLIENT, null)
  })

  test('should throw an error when used outside of setup function', () => {
    getCurrentInstanceSpy.mockReturnValueOnce(undefined)

    expect(useQueryClient).toThrowError()
    expect(getCurrentInstanceSpy).toHaveBeenCalledTimes(1)
  })

  test('should call inject with a custom key as a suffix', () => {
    const queryClientKey = 'foo'
    const expectedKeyParameter = `${VUE_QUERY_CLIENT}:${queryClientKey}`
    const queryClientMock = { name: 'Mocked client' }
    injectSpy.mockReturnValueOnce(queryClientMock)

    useQueryClient(queryClientKey)

    expect(injectSpy).toHaveBeenCalledWith(expectedKeyParameter, null)
  })
})
