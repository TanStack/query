import { isPlatformServer } from '@angular/common'
import {
  DestroyRef,
  InjectionToken,
  PLATFORM_ID,
  TransferState,
  inject,
  makeEnvironmentProviders,
  makeStateKey,
  provideEnvironmentInitializer,
} from '@angular/core'
import type { EnvironmentProviders } from '@angular/core'
import {
  QueryClient,
  dehydrate,
  hydrate,
  type DehydratedState,
} from '@tanstack/query-core'
import { INTERNAL_TANSTACK_QUERY_HYDRATION_TRANSFER_KEY } from './hydration-state-key'

function configureQueryClientTransferState() {
  const queryClient = inject(QueryClient)
  const destroyRef = inject(DestroyRef)
  const transferState = inject(TransferState)
  const platformId = inject(PLATFORM_ID)
  const hydrationStateKey = inject(INTERNAL_TANSTACK_QUERY_HYDRATION_TRANSFER_KEY)

  if (isPlatformServer(platformId)) {
    transferState.onSerialize(hydrationStateKey, () => dehydrate(queryClient))
  }

  const dehydratedState = transferState.get(hydrationStateKey, null)
  if (dehydratedState) {
    hydrate(queryClient, dehydratedState)
    transferState.remove(hydrationStateKey)
  }

  queryClient.mount()
  destroyRef.onDestroy(() => queryClient.unmount())
}

/**
 * Usually {@link provideTanStackQuery} is used once to set up TanStack Query and the
 * {@link https://tanstack.com/query/latest/docs/reference/QueryClient|QueryClient}
 * for the entire application. Internally it calls `provideQueryClient`.
 * You can use `provideQueryClient` to provide a different `QueryClient` instance for a part
 * of the application or for unit testing purposes.
 *
 * @param queryClient - A `QueryClient` instance, or an `InjectionToken` which provides a `QueryClient`.
 * @returns A single {@link EnvironmentProviders} value to add to environment `providers` (do not spread).
 */
export function provideQueryClient(
  queryClient: QueryClient | InjectionToken<QueryClient>,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    queryClient instanceof InjectionToken
      ? { provide: QueryClient, useExisting: queryClient }
      : { provide: QueryClient, useValue: queryClient },
    provideEnvironmentInitializer(configureQueryClientTransferState),
  ])
}

/**
 * Sets up providers necessary to enable TanStack Query functionality for Angular applications.
 *
 * Allows to configure a `QueryClient` and optional features such as developer tools.
 *
 * **Example - standalone**
 *
 * ```ts
 * import {
 *   provideTanStackQuery,
 *   QueryClient,
 * } from '@tanstack/angular-query-experimental'
 *
 * bootstrapApplication(AppComponent, {
 *   providers: [provideTanStackQuery(new QueryClient())],
 * })
 * ```
 *
 * **Example - NgModule-based**
 *
 * ```ts
 * import {
 *   provideTanStackQuery,
 *   QueryClient,
 * } from '@tanstack/angular-query-experimental'
 *
 * @NgModule({
 *   declarations: [AppComponent],
 *   imports: [BrowserModule],
 *   providers: [provideTanStackQuery(new QueryClient())],
 *   bootstrap: [AppComponent],
 * })
 * export class AppModule {}
 * ```
 *
 * ```ts
 * import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental'
 * import { withDevtools } from '@tanstack/angular-query-devtools'
 *
 * bootstrapApplication(AppComponent, {
 *   providers: [provideTanStackQuery(new QueryClient(), withDevtools())],
 * })
 * ```
 *
 * **Example: using an InjectionToken**
 *
 * ```ts
 * export const MY_QUERY_CLIENT = new InjectionToken('', {
 *   factory: () => new QueryClient(),
 * })
 *
 * providers: [provideTanStackQuery(MY_QUERY_CLIENT)]
 * ```
 *
 * @param queryClient - A `QueryClient` instance, or an `InjectionToken` which provides a `QueryClient`.
 * @param features - Optional features to configure additional Query functionality.
 * @returns A single {@link EnvironmentProviders} value (do not spread into `providers`).
 * @see https://tanstack.com/query/v5/docs/framework/angular/quick-start
 * @see https://tanstack.com/query/v5/docs/framework/angular/devtools
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/ssr
 */
export function provideTanStackQuery(
  queryClient: QueryClient | InjectionToken<QueryClient>,
  ...features: Array<QueryFeatures>
): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideQueryClient(queryClient),
    ...features.flatMap((feature) => feature.ɵproviders),
  ])
}

type QueryFeatureKind = 'Devtools' | 'Hydration' | 'PersistQueryClient'

/**
 * Helper type to represent a Query feature.
 */
export interface QueryFeature<TFeatureKind extends QueryFeatureKind> {
  ɵkind: TFeatureKind
  ɵproviders: EnvironmentProviders
}

/**
 * Helper function to create an object that represents a Query feature.
 * @param kind - The feature kind identifier.
 * @param providers - The providers contributed by the feature.
 * @returns A Query feature.
 */
export function queryFeature<TFeatureKind extends QueryFeatureKind>(
  kind: TFeatureKind,
  providers: EnvironmentProviders,
): QueryFeature<TFeatureKind> {
  return { ɵkind: kind, ɵproviders: providers }
}

/**
 * A type alias that represents a feature which enables developer tools.
 * The type is used to describe the return value of the `withDevtools` function.
 * @see {@link withDevtools}
 */
export type DevtoolsFeature = QueryFeature<'Devtools'>

/**
 * A type alias that represents a feature which enables persistence.
 * The type is used to describe the return value of the `withPersistQueryClient` function.
 */
export type PersistQueryClientFeature = QueryFeature<'PersistQueryClient'>

/**
 * Sets a non-default serialization key for this injector’s `QueryClient` cache (server dehydrate /
 * browser hydrate via `TransferState`). Use this when you have multiple `QueryClient` instances
 * so each has its own key. The default key applies when you do not add this feature.
 *
 * ```ts
 * providers: [
 *   provideTanStackQuery(secondaryClient, withHydrationKey('my-secondary-query-cache')),
 * ]
 * ```
 *
 * @param key - A unique string for this client’s `TransferState` entry.
 * @public
 */
export function withHydrationKey(key: string): QueryFeature<'Hydration'> {
  return queryFeature('Hydration', makeEnvironmentProviders([
    {
      provide: INTERNAL_TANSTACK_QUERY_HYDRATION_TRANSFER_KEY,
      useValue: makeStateKey<DehydratedState>(key),
    },
  ]))
}

/**
 * A type alias that represents all Query features available for use with `provideTanStackQuery`.
 * Features can be enabled by adding special functions to the `provideTanStackQuery` call.
 * See documentation for each symbol to find corresponding function name. See also `provideTanStackQuery`
 * documentation on how to use those functions.
 * @see {@link provideTanStackQuery}
 */
export type QueryFeatures =
  | DevtoolsFeature
  | QueryFeature<'Hydration'>
  | PersistQueryClientFeature
