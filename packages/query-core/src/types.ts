/* istanbul ignore file */

/**
 * This file re-exports all types from the types/ directory for backwards compatibility.
 * The types have been organized into separate files by concern:
 *
 * - types/common.ts - Shared utility types (Register, DefaultError, NetworkMode, etc.)
 * - types/query.ts - Query-related types (QueryKey, QueryOptions, QueryFunction, etc.)
 * - types/observer.ts - Observer-related types (QueryObserverOptions, QueryObserverResult, etc.)
 * - types/mutation.ts - Mutation-related types (MutationKey, MutationOptions, etc.)
 * - types/client.ts - Client configuration types (QueryClientConfig, DefaultOptions)
 * - types/index.ts - Re-exports everything
 */

// Re-export everything from the types directory
export * from './types/index'

// Re-export the runtime values (symbols) directly
export { dataTagSymbol, dataTagErrorSymbol, unsetMarker } from './types/query'
