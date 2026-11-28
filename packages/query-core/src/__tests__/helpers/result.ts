import * as queryPredicates from '@tanstack/query-core'
import { createQueryResultSnapshot } from '@tanstack/query-test-utils'

/** The narrowed result type guaranteed by a public query predicate. */
export type Guarded<TGuard> = TGuard extends ((
  result: any,
) => result is infer T)
  ? T
  : never

// Materialize intersections before comparing property modifiers. This preserves
// readonly properties, which the original writable-branch assertions detect.
type Properties<T> = { [K in keyof T]: T[K] }
/** The individual properties of a result narrowed by the public predicate. */
export type GuardedProperties<TGuard> = Properties<Guarded<TGuard>>

// For the v6 tests that pin literal flag types, compare the known result
// variant with what the real predicate accepts when it returns true.
type Possible<T> = T extends { data: never } | { fetchDirection: never }
  ? never
  : T
/** Whether a result always, never, or sometimes satisfies a predicate. */
export type FlagFor<TResult, TGuard> = [TResult] extends [Guarded<TGuard>]
  ? true
  : [Possible<Guarded<TGuard>>] extends [never]
    ? false
    : boolean

export const resultForComparison = createQueryResultSnapshot(queryPredicates)
