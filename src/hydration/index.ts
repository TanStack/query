// This package once contained these functions, but they have now been moved
// into the core and react packages.
// They are re-exported here to avoid a breaking change, but this package
// should be considered deprecated and removed in a future major version.
export { dehydrate, hydrate, useHydrate, Hydrate } from 'react-query'

// Types
export type {
  DehydrateOptions,
  DehydratedState,
  HydrateOptions,
  ShouldDehydrateMutationFunction,
  ShouldDehydrateQueryFunction,
} from '../core/hydration'
export type { HydrateProps } from '../react/Hydrate'
