import { describe, expectTypeOf, it } from 'vitest'
import type { QueryBehavior, RetryDelayValue, RetryValue } from '..'

// Regression for #11042: the types referenced by the public `queryOptions`
// signature must be reachable from the package root, otherwise downstream
// declaration emit cannot name them.
describe('public type exports', () => {
  it('re-exports retry and behavior helper types from the package root', () => {
    expectTypeOf<RetryValue<Error>>().not.toBeNever()
    expectTypeOf<RetryDelayValue<Error>>().not.toBeNever()
    expectTypeOf<QueryBehavior>().not.toBeNever()
  })
})
