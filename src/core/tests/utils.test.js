import { setConsole, queryCache, queryCaches } from '../'
import { deepEqual } from '../utils'

describe('core/utils', () => {
  afterEach(() => {
    queryCaches.forEach(cache => cache.clear({ notify: false }))
  })

  it('setConsole should override Console object', async () => {
    const mockConsole = {
      error: jest.fn(),
    }

    setConsole(mockConsole)

    await queryCache.prefetchQuery(
      'key',
      async () => {
        throw new Error('Test')
      },
      {
        retry: 0,
      }
    )

    expect(mockConsole.error).toHaveBeenCalled()

    setConsole(console)
  })

  it('deepequal should return `false` for different dates', () => {
    const date1 = new Date(2020, 3, 1)
    const date2 = new Date(2020, 3, 2)

    expect(deepEqual(date1, date2)).toEqual(false)
  })

  it('should return `true` for equal dates', () => {
    const date1 = new Date(2020, 3, 1)
    const date2 = new Date(2020, 3, 1)

    expect(deepEqual(date1, date2)).toEqual(true)
  })
})
