import { describe, expect, test } from 'vitest'
import { sortDataByOrder } from '../utils/sort-data-by-order'

describe('create-route-property-order utils', () => {
  describe('sortDataByOrder', () => {
    const testCases = [
      {
        data: [{ key: 'a' }, { key: 'c' }, { key: 'b' }],
        orderArray: [
          [['a'], ['b']],
          [['b'], ['c']],
        ],
        key: 'key',
        expected: [{ key: 'a' }, { key: 'b' }, { key: 'c' }],
      },
      {
        data: [{ key: 'b' }, { key: 'a' }, { key: 'c' }],
        orderArray: [
          [['a'], ['b']],
          [['b'], ['c']],
        ],
        key: 'key',
        expected: [{ key: 'a' }, { key: 'b' }, { key: 'c' }],
      },
      {
        data: [{ key: 'a' }, { key: 'b' }, { key: 'c' }],
        orderArray: [
          [['a'], ['b']],
          [['b'], ['c']],
        ],
        key: 'key',
        expected: null,
      },
      {
        data: [{ key: 'a' }, { key: 'b' }, { key: 'c' }, { key: 'd' }],
        orderArray: [
          [['a'], ['b']],
          [['b'], ['c']],
        ],
        key: 'key',
        expected: null,
      },
      {
        data: [{ key: 'a' }, { key: 'b' }, { key: 'd' }, { key: 'c' }],
        orderArray: [
          [['a'], ['b']],
          [['b'], ['c']],
        ],
        key: 'key',
        expected: null,
      },
      {
        data: [{ key: 'd' }, { key: 'a' }, { key: 'b' }, { key: 'c' }],
        orderArray: [
          [['a'], ['b']],
          [['b'], ['c']],
        ],
        key: 'key',
        expected: null,
      },
      {
        data: [{ key: 'd' }, { key: 'b' }, { key: 'a' }, { key: 'c' }],
        orderArray: [
          [['a'], ['b']],
          [['b'], ['c']],
        ],
        key: 'key',
        expected: [{ key: 'd' }, { key: 'a' }, { key: 'b' }, { key: 'c' }],
      },
    ] as const
    test.each(testCases)(
      '$data $orderArray $key $expected',
      ({ data, orderArray, key, expected }) => {
        const sortedData = sortDataByOrder(data, orderArray, key)
        expect(sortedData).toEqual(expected)
      },
    )
  })
})
