import * as exhaustiveDeps from './rules/exhaustive-deps/exhaustive-deps.rule'
import * as stableQueryClient from './rules/stable-query-client/stable-query-client.rule'
import * as noRestDestructuring from './rules/no-rest-destructuring/no-rest-destructuring.rule'
import * as noUnstableDeps from './rules/no-unstable-deps/no-unstable-deps.rule'
import * as infiniteQueryPropertyOrder from './rules/infinite-query-property-order/infinite-query-property-order.rule'
import * as noVoidQueryFn from './rules/no-void-query-fn/no-void-query-fn.rule'
import * as mutationPropertyOrder from './rules/mutation-property-order/mutation-property-order.rule'
import type { ESLintUtils } from '@typescript-eslint/utils'
import type { ExtraRuleDocs } from './types'

export const rules: Record<
  string,
  ESLintUtils.RuleModule<
    string,
    ReadonlyArray<unknown>,
    ExtraRuleDocs,
    ESLintUtils.RuleListener
  >
> = {
  [exhaustiveDeps.name]: exhaustiveDeps.rule,
  [stableQueryClient.name]: stableQueryClient.rule,
  [noRestDestructuring.name]: noRestDestructuring.rule,
  [noUnstableDeps.name]: noUnstableDeps.rule,
  [infiniteQueryPropertyOrder.name]: infiniteQueryPropertyOrder.rule,
  [noVoidQueryFn.name]: noVoidQueryFn.rule,
  [mutationPropertyOrder.name]: mutationPropertyOrder.rule,
}
