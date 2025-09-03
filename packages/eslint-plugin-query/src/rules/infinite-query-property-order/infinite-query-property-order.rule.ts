import { createPropertyOrderRule } from '../../utils/create-property-order-rule'
import { infiniteQueryFunctions, sortRules } from './constants'
import type {
  InfiniteQueryFunctions,
  InfiniteQueryProperties,
} from './constants'

export const name = 'infinite-query-property-order'

export const rule = createPropertyOrderRule<
  InfiniteQueryFunctions,
  InfiniteQueryProperties
>(
  {
    name,
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ensure correct order of inference sensitive properties for infinite queries',
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
  infiniteQueryFunctions,
  sortRules,
)
