import { RuleTester } from '@typescript-eslint/rule-tester'
import combinate from 'combinate'

import {
  checkedProperties,
  infiniteQueryFunctions,
} from '../rules/infinite-query-property-order/constants'
import {
  name,
  rule,
} from '../rules/infinite-query-property-order/infinite-query-property-order.rule'
import {
  generateInterleavedCombinations,
  generatePartialCombinations,
  generatePermutations,
} from './test-utils'
import type { InfiniteQueryFunctions } from '../rules/infinite-query-property-order/constants'

const ruleTester = new RuleTester()

type CheckedProperties = (typeof checkedProperties)[number]
const orderIndependentProps = ['queryKey', '...foo'] as const
type OrderIndependentProps = (typeof orderIndependentProps)[number]

interface TestCase {
  infiniteQueryFunction: InfiniteQueryFunctions
  properties: Array<CheckedProperties | OrderIndependentProps>
}

const validTestMatrix = combinate({
  infiniteQueryFunction: [...infiniteQueryFunctions],
  properties: generatePartialCombinations(checkedProperties, 2),
})

export function generateInvalidPermutations(
  arr: ReadonlyArray<CheckedProperties>,
): Array<{
  invalid: Array<CheckedProperties>
  valid: Array<CheckedProperties>
}> {
  const combinations = generatePartialCombinations(arr, 2)
  const allPermutations: Array<{
    invalid: Array<CheckedProperties>
    valid: Array<CheckedProperties>
  }> = []

  for (const combination of combinations) {
    const permutations = generatePermutations(combination)
    // skip the first permutation as it matches the original combination
    const invalidPermutations = permutations.slice(1)

    if (
      combination.includes('getNextPageParam') &&
      combination.includes('getPreviousPageParam')
    ) {
      if (
        combination.indexOf('getNextPageParam') <
        combination.indexOf('getPreviousPageParam')
      ) {
        // since we ignore the relative order of 'getPreviousPageParam' and 'getNextPageParam', we skip this combination (but keep the other one where `getPreviousPageParam` is before `getNextPageParam`)

        continue
      }
    }

    allPermutations.push(
      ...invalidPermutations
        .map((p) => {
          // ignore the relative order of 'getPreviousPageParam' and 'getNextPageParam'
          const correctedValid = [...combination].sort((a, b) => {
            if (
              (a === 'getNextPageParam' && b === 'getPreviousPageParam') ||
              (a === 'getPreviousPageParam' && b === 'getNextPageParam')
            ) {
              return p.indexOf(a) - p.indexOf(b)
            }
            return checkedProperties.indexOf(a) - checkedProperties.indexOf(b)
          })
          return { invalid: p, valid: correctedValid }
        })
        .filter(
          ({ invalid }) =>
            // if `getPreviousPageParam` and `getNextPageParam` are next to each other and `queryFn` is not present, we skip this invalid permutation
            Math.abs(
              invalid.indexOf('getNextPageParam') -
                invalid.indexOf('getPreviousPageParam'),
            ) !== 1 && !invalid.includes('queryFn'),
        ),
    )
  }

  return allPermutations
}

const invalidPermutations = generateInvalidPermutations(checkedProperties)

type Interleaved = CheckedProperties | OrderIndependentProps
const interleavedInvalidPermutations: Array<{
  invalid: Array<Interleaved>
  valid: Array<Interleaved>
}> = []
for (const invalidPermutation of invalidPermutations) {
  const invalid = generateInterleavedCombinations(
    invalidPermutation.invalid,
    orderIndependentProps,
  )
  const valid = generateInterleavedCombinations(
    invalidPermutation.valid,
    orderIndependentProps,
  )

  for (let i = 0; i < invalid.length; i++) {
    interleavedInvalidPermutations.push({
      invalid: invalid[i]!,
      valid: valid[i]!,
    })
  }
}

const invalidTestMatrix = combinate({
  infiniteQueryFunction: [...infiniteQueryFunctions],
  properties: interleavedInvalidPermutations,
})

function getCode({
  infiniteQueryFunction: infiniteQueryFunction,
  properties,
}: TestCase) {
  function getPropertyCode(
    property: CheckedProperties | OrderIndependentProps,
  ) {
    if (property.startsWith('...')) {
      return property
    }
    switch (property) {
      case 'queryKey':
        return `queryKey: ['projects']`
      case 'queryFn':
        return 'queryFn: async ({ pageParam }) => { \n await fetch(`/api/projects?cursor=${pageParam}`) \n return await response.json() \n }'
      case 'getPreviousPageParam':
        return 'getPreviousPageParam: (firstPage) => firstPage.previousId ?? undefined'
      case 'getNextPageParam':
        return 'getNextPageParam: (lastPage) => lastPage.nextId ?? undefined'
    }

    return `${property}: () => null`
  }
  return `
    import { ${infiniteQueryFunction} } from '@tanstack/react-query'

    ${infiniteQueryFunction}({
        ${properties.map(getPropertyCode).join(',\n        ')}
    })
  `
}

const validTestCases = validTestMatrix.map(
  ({ infiniteQueryFunction, properties }) => ({
    name: `should pass when order is correct for ${infiniteQueryFunction} with order: ${properties.join(', ')}`,
    code: getCode({ infiniteQueryFunction, properties }),
  }),
)

const invalidTestCases = invalidTestMatrix.map(
  ({ infiniteQueryFunction, properties }) => ({
    name: `incorrect property order is detected for ${infiniteQueryFunction} with invalid order: ${properties.invalid.join(', ')}, valid order: ${properties.valid.join(', ')}`,
    code: getCode({
      infiniteQueryFunction: infiniteQueryFunction,
      properties: properties.invalid,
    }),
    errors: [{ messageId: 'invalidOrder' }],
    output: getCode({
      infiniteQueryFunction: infiniteQueryFunction,
      properties: properties.valid,
    }),
  }),
)

ruleTester.run(name, rule, {
  valid: validTestCases,
  invalid: invalidTestCases,
})
