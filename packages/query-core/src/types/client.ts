/* istanbul ignore file */

import type { DehydrateOptions, HydrateOptions } from '../hydration'
import type { QueryCache } from '../queryCache'
import type { MutationCache } from '../mutationCache'
import type { DefaultError, OmitKeyof } from './common'
import type { QueryObserverOptions } from './observer'
import type { MutationObserverOptions } from './mutation'

export interface QueryClientConfig {
  queryCache?: QueryCache
  mutationCache?: MutationCache
  defaultOptions?: DefaultOptions
}

export interface DefaultOptions<TError = DefaultError> {
  queries?: OmitKeyof<
    QueryObserverOptions<unknown, TError>,
    'suspense' | 'queryKey'
  >
  mutations?: MutationObserverOptions<unknown, TError, unknown, unknown>
  hydrate?: HydrateOptions['defaultOptions']
  dehydrate?: DehydrateOptions
}
