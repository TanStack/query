import { createPropertyOrderRule } from '../../utils/create-property-order-rule'
import { mutationFunctions, sortRules } from './constants'
import type { MutationFunctions, MutationProperties } from './constants'

export const name = 'mutation-property-order'

export const rule = createPropertyOrderRule<
  MutationFunctions,
  MutationProperties
>(
  {
    name,
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ensure correct order of inference-sensitive properties in useMutation()',
        recommended: 'error',
      },
      messages: {
        invalidOrder: 'Invalid order of properties for `{{function}}`.',
      },
      schema: [],
      hasSuggestions: true,
      fixable: 'code',
    },
    defaultOptions: [],
  },
  mutationFunctions,
  sortRules,
)
