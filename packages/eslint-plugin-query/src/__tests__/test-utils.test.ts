import { describe, expect, test } from 'vitest'
import {
  expectArrayEqualIgnoreOrder,
  generateInterleavedCombinations,
  generatePartialCombinations,
  generatePermutations,
} from './test-utils'

describe('test-utils', () => {
  describe('generatePermutations', () => {
    const testCases = [
      {
        input: ['a', 'b', 'c'],
        expected: [
          ['a', 'b', 'c'],
          ['a', 'c', 'b'],
          ['b', 'a', 'c'],
          ['b', 'c', 'a'],
          ['c', 'a', 'b'],
          ['c', 'b', 'a'],
        ],
      },
      {
        input: ['a', 'b'],
        expected: [
          ['a', 'b'],
          ['b', 'a'],
        ],
      },
      {
        input: ['a'],
        expected: [['a']],
      },
    ]
    test.each(testCases)('$input $expected', ({ input, expected }) => {
      const permutations = generatePermutations(input)
      expect(permutations).toEqual(expected)
    })
  })

  describe('generatePartialCombinations', () => {
    const testCases = [
      {
        input: ['a', 'b', 'c'],
        minLength: 2,
        expected: [
          ['a', 'b'],
          ['a', 'c'],
          ['b', 'c'],
          ['a', 'b', 'c'],
        ],
      },
      {
        input: ['a', 'b'],
        expected: [['a', 'b']],
        minLength: 2,
      },
      {
        input: ['a'],
        expected: [],
        minLength: 2,
      },
      {
        input: ['a'],
        expected: [['a']],
        minLength: 1,
      },
      {
        input: ['a'],
        expected: [[], ['a']],
        minLength: 0,
      },
    ]
    test.each(testCases)(
      '$input $minLength $expected',
      ({ input, minLength, expected }) => {
        const combinations = generatePartialCombinations(input, minLength)
        expectArrayEqualIgnoreOrder(combinations, expected)
      },
    )
  })

  describe('generateInterleavedCombinations', () => {
    const testCases = [
      {
        data: ['a', 'b'],
        additional: ['x'],
        expected: [
          ['a', 'b'],
          ['x', 'a', 'b'],
          ['a', 'x', 'b'],
          ['a', 'b', 'x'],
        ],
      },
    ]
    test.each(testCases)(
      '$input $expected',
      ({ data, additional, expected }) => {
        const combinations = generateInterleavedCombinations(data, additional)
        expectArrayEqualIgnoreOrder(combinations, expected)
      },
    )
  })
})
