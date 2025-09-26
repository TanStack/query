import { RuleTester } from '@typescript-eslint/rule-tester'
import combinate from 'combinate'

import {
  checkedProperties,
  mutationFunctions,
} from '../rules/mutation-property-order/constants'
import {
  name,
  rule,
} from '../rules/mutation-property-order/mutation-property-order.rule'
import {
  generateInterleavedCombinations,
  generatePartialCombinations,
  generatePermutations,
  normalizeIndent,
} from './test-utils'
import type { MutationFunctions } from '../rules/mutation-property-order/constants'

const ruleTester = new RuleTester()

type CheckedProperties = (typeof checkedProperties)[number]
const orderIndependentProps = [
  'gcTime',
  '...objectExpressionSpread',
  '...callExpressionSpread',
  '...memberCallExpressionSpread',
] as const
type OrderIndependentProps = (typeof orderIndependentProps)[number]

interface TestCase {
  mutationFunction: MutationFunctions
  properties: Array<CheckedProperties | OrderIndependentProps>
}

const validTestMatrix = combinate({
  mutationFunction: [...mutationFunctions],
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

    if (combination.includes('onError') && combination.includes('onSettled')) {
      if (combination.indexOf('onError') < combination.indexOf('onSettled')) {
        // since we ignore the relative order of 'onError' and 'onSettled', we skip this combination (but keep the other one where `onSettled` is before `onError`)

        continue
      }
    }

    allPermutations.push(
      ...invalidPermutations
        .map((p) => {
          // ignore the relative order of 'onError' and 'onSettled'
          const correctedValid = [...combination].sort((a, b) => {
            if (
              (a === 'onSettled' && b === 'onError') ||
              (a === 'onError' && b === 'onSettled')
            ) {
              return p.indexOf(a) - p.indexOf(b)
            }
            return checkedProperties.indexOf(a) - checkedProperties.indexOf(b)
          })
          return { invalid: p, valid: correctedValid }
        })
        .filter(
          ({ invalid }) =>
            // if `onError` and `onSettled` are next to each other and `onMutate` is not present, we skip this invalid permutation
            Math.abs(
              invalid.indexOf('onSettled') - invalid.indexOf('onError'),
            ) !== 1,
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
  mutationFunction: [...mutationFunctions],
  properties: interleavedInvalidPermutations,
})

const callExpressionSpread = normalizeIndent`
        ...mutationOptions({
            onSuccess: () => {},
            retry: 3,
        })`

function getCode({ mutationFunction: mutationFunction, properties }: TestCase) {
  function getPropertyCode(
    property: CheckedProperties | OrderIndependentProps,
  ) {
    switch (property) {
      case '...objectExpressionSpread':
        return `...objectExpressionSpread`
      case '...callExpressionSpread':
        return callExpressionSpread
      case '...memberCallExpressionSpread':
        return '...myOptions.mutationOptions()'
      case 'gcTime':
        return 'gcTime: 5 * 60 * 1000'
      case 'onMutate':
        return 'onMutate: (data) => {\n return { foo: data }\n}'
      case 'onError':
        return 'onError: (error, variables, onMutateResult) => {\n  console.log("error:", error, "onMutateResult:", scope)\n}'
      case 'onSettled':
        return 'onSettled: (data, error, variables, onMutateResult) => {\n  console.log("settled", onMutateResult)\n}'
    }
  }
  return `
    import { ${mutationFunction} } from '@tanstack/react-query'

    ${mutationFunction}({
        ${properties.map(getPropertyCode).join(',\n        ')}
    })
  `
}

const validTestCases = validTestMatrix.map(
  ({ mutationFunction, properties }) => ({
    name: `should pass when order is correct for ${mutationFunction} with order: ${properties.join(', ')}`,
    code: getCode({
      mutationFunction: mutationFunction,
      properties,
    }),
  }),
)

const invalidTestCases = invalidTestMatrix.map(
  ({ mutationFunction, properties }) => ({
    name: `incorrect property order id detected for ${mutationFunction} with invalid order: ${properties.invalid.join(', ')}, valid order ${properties.valid.join(', ')}`,
    code: getCode({
      mutationFunction: mutationFunction,
      properties: properties.invalid,
    }),
    errors: [{ messageId: 'invalidOrder' }],
    output: getCode({
      mutationFunction: mutationFunction,
      properties: properties.valid,
    }),
  }),
)

ruleTester.run(name, rule, {
  valid: validTestCases,
  invalid: invalidTestCases,
})

const regressionTestCases = {
  valid: [
    {
      name: 'should pass with call expression spread in useMutation',
      code: normalizeIndent`
      import { useMutation } from '@tanstack/react-query'

      const { mutate } = useMutation({
        ...mutationOptions({
          retry: 3,
          onSuccess: () => console.log('success'),
        }),
        onMutate: (data) => {
          return { foo: data }
        },
        onError: (error, variables, onMutateResult) => {
          console.log(error, onMutateResult)
        },
        onSettled: (data, error, variables, onMutateResult) => {
          console.log('settled', onMutateResult)
        },
      })
      `,
    },
  ],
  invalid: [],
}

ruleTester.run(name, rule, regressionTestCases)
