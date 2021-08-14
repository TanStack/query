export { dehydrate, hydrate } from 'react-query'
export { useHydrate, Hydrate } from './react'

// Types
export type {
  DehydrateOptions,
  DehydratedState,
  HydrateOptions,
  ShouldDehydrateMutationFunction,
  ShouldDehydrateQueryFunction,
} from '../core/hydration'
export type { HydrateProps } from './react'
