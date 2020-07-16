import { setConsole, queryCache, queryCaches } from '../'
import { deepEqual, shallowEqual } from '../utils'

describe('core/utils', () => {
  afterEach(() => {
    queryCaches.forEach(cache => cache.clear({ notify: false }))
  })

  it('setConsole should override Console object', async () => {
    const mockConsole = {
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
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

  describe('deepEqual', () => {
    it('should return `true` for equal objects', () => {
      const a = { a: { b: 'b' }, c: 'c', d: [{ d: 'd ' }] }
      const b = { a: { b: 'b' }, c: 'c', d: [{ d: 'd ' }] }
      expect(deepEqual(a, b)).toEqual(true)
    })

    it('should return `false` for non equal objects', () => {
      const a = { a: { b: 'b' }, c: 'c' }
      const b = { a: { b: 'c' }, c: 'c' }
      expect(deepEqual(a, b)).toEqual(false)
    })

    it('should return `false` for different dates', () => {
      const date1 = new Date(2020, 3, 1)
      const date2 = new Date(2020, 3, 2)
      expect(deepEqual(date1, date2)).toEqual(false)
    })

    it('return `true` for equal dates', () => {
      const date1 = new Date(2020, 3, 1)
      const date2 = new Date(2020, 3, 1)
      expect(deepEqual(date1, date2)).toEqual(true)
    })
  })

  describe('shallowEqual', () => {
    it('should return `true` for empty objects', () => {
      expect(shallowEqual({}, {})).toEqual(true)
    })

    it('should return `true` for equal values', () => {
      expect(shallowEqual(1, 1)).toEqual(true)
    })

    it('should return `true` for equal arrays', () => {
      expect(shallowEqual([1, 2], [1, 2])).toEqual(true)
    })

    it('should return `true` for equal shallow objects', () => {
      const a = { a: 'a', b: 'b' }
      const b = { a: 'a', b: 'b' }
      expect(shallowEqual(a, b)).toEqual(true)
    })

    it('should return `true` for equal deep objects with same identities', () => {
      const deep = { b: 'b' }
      const a = { a: deep, c: 'c' }
      const b = { a: deep, c: 'c' }
      expect(shallowEqual(a, b)).toEqual(true)
    })

    it('should return `false` for non equal values', () => {
      expect(shallowEqual(1, 2)).toEqual(false)
    })

    it('should return `false` for equal arrays', () => {
      expect(shallowEqual([1, 2], [1, 3])).toEqual(false)
    })

    it('should return `false` for non equal shallow objects', () => {
      const a = { a: 'a', b: 'b' }
      const b = { a: 'a', b: 'c' }
      expect(shallowEqual(a, b)).toEqual(false)
    })

    it('should return `false` for equal deep objects with different identities', () => {
      const a = { a: { b: 'b' }, c: 'c' }
      const b = { a: { b: 'b' }, c: 'c' }
      expect(shallowEqual(a, b)).toEqual(false)
    })
  })
})
