import { describe, expectTypeOf, it } from 'vitest'
import type { MaybeRefOrGetter, ShallowOption } from '..'

// Regression for #11042: the vue-query helper types referenced by the public
// `queryOptions` signature must be reachable from the package root so that
// downstream declaration emit can name them.
describe('public type exports', () => {
  it('re-exports vue-query helper types from the package root', () => {
    expectTypeOf<ShallowOption>().not.toBeNever()
    expectTypeOf<MaybeRefOrGetter<number>>().not.toBeNever()
  })
})
