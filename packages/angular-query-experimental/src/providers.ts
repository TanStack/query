import { isPlatformBrowser, isPlatformServer } from '@angular/common'
import {
  DOCUMENT,
  DestroyRef,
  ENVIRONMENT_INITIALIZER,
  InjectionToken,
  PLATFORM_ID,
  TransferState,
  inject,
  makeStateKey,
} from '@angular/core'
import {
  
  QueryClient,
  dehydrate,
  hydrate
} from '@tanstack/query-core'
import { INTERNAL_TANSTACK_QUERY_HYDRATION_TRANSFER_KEY } from './hydration-state-key'
import type {DehydratedState} from '@tanstack/query-core';
import type { Provider } from '@angular/core'

const INTERNAL_QUERY_CLIENT_SHOULD_HYDRATE = new InjectionToken<boolean>('', {
  providedIn: 'root',
  factory: () => true,
})

function configureQueryClient() {
  const queryClient = inject(QueryClient)
  const destroyRef = inject(DestroyRef)
  const platformId = inject(PLATFORM_ID)
  const shouldHydrate = inject(INTERNAL_QUERY_CLIENT_SHOULD_HYDRATE)
  const hydrationStateKey = inject(INTERNAL_TANSTACK_QUERY_HYDRATION_TRANSFER_KEY)

  if (inject(DOCUMENT, { optional: true })) {
    const transferState = inject(TransferState)

    if (shouldHydrate && isPlatformServer(platformId)) {
      transferState.onSerialize(hydrationStateKey, () => dehydrate(queryClient))
    } else if (shouldHydrate && isPlatformBrowser(platformId)) {
      const dehydratedState = transferState.get(hydrationStateKey, null)
      if (dehydratedState) {
        hydrate(queryClient, dehydratedState)
        transferState.remove(hydrationStateKey)
      }
    }
  }

  queryClient.mount()
  destroyRef.onDestroy(() => queryClient.unmount())
}

const queryClientInitializerProvider: Provider = {
  provide: ENVIRONMENT_INITIALIZER,
  multi: true,
  useValue: configureQueryClient,
}

function createQueryClientProviders(
  queryClient: QueryClient | InjectionToken<QueryClient>,
): Array<Provider> {
  return [
    queryClient instanceof InjectionToken
      ? { provide: QueryClient, useExisting: queryClient }
      : { provide: QueryClient, useValue: queryClient },
  ]
}

/**
 * Usually {@link provideTanStackQuery} is used once to set up TanStack Query and the
 * {@link https://tanstack.com/query/latest/docs/reference/QueryClient|QueryClient}
 * for the entire application. Internally it calls `provideQueryClient`.
 * You can use `provideQueryClient` to provide a different `QueryClient` instance for a part
 * of the application or for unit testing purposes.
 *
 * @param queryClient - A `QueryClient` instance, or an `InjectionToken` which provides a `QueryClient`.
 * @returns Providers to register with the spread operator, e.g. `providers: [...provideQueryClient(client)]`.
 */
export function provideQueryClient(
  queryClient: QueryClient | InjectionToken<QueryClient>,
): Array<Provider> {
  return [...createQueryClientProviders(queryClient), queryClientInitializerProvider]
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
 *   providers: [...provideTanStackQuery(new QueryClient())],
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
 *   providers: [...provideTanStackQuery(new QueryClient())],
 *   bootstrap: [AppComponent],
 * })
 * export class AppModule {}
 * ```
 *
 * You can also enable optional developer tools by adding `withDevtools`. By
 * default the tools will then be loaded when your app is in development mode.
 *
 * ```ts
 * import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental'
 * import { withDevtools } from '@tanstack/angular-query-devtools'
 *
 * bootstrapApplication(AppComponent, {
 *   providers: [...provideTanStackQuery(new QueryClient(), withDevtools())],
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
 * // In a lazy loaded route or lazy loaded component's providers array:
 * providers: [...provideTanStackQuery(MY_QUERY_CLIENT)]
 * ```
 * Using an InjectionToken for the QueryClient is an advanced optimization which allows TanStack Query to be absent from the main application bundle.
 * This can be beneficial if you want to include TanStack Query on lazy loaded routes only while still sharing a `QueryClient`.
 *
 * Note that this is a small optimization and for most applications it's preferable to provide the `QueryClient` in the main application config.
 * @param queryClient - A `QueryClient` instance, or an `InjectionToken` which provides a `QueryClient`.
 * @param features - Optional features to configure additional Query functionality.
 * @returns A set of providers to set up TanStack Query (spread into `providers`).
 * @see https://tanstack.com/query/v5/docs/framework/angular/quick-start
 * @see https://tanstack.com/query/v5/docs/framework/angular/devtools
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/ssr
 */
export function provideTanStackQuery(
  queryClient: QueryClient | InjectionToken<QueryClient>,
  ...features: Array<QueryFeatures>
): Array<Provider> {
  return [
    ...createQueryClientProviders(queryClient),
    ...features.flatMap((feature) => feature.ɵproviders),
    queryClientInitializerProvider,
  ]
}

/**
 * Sets up providers necessary to enable TanStack Query functionality for Angular applications.
 *
 * Allows to configure a `QueryClient`.
 * @param queryClient - A `QueryClient` instance.
 * @returns A set of providers to set up TanStack Query.
 * @see https://tanstack.com/query/v5/docs/framework/angular/quick-start
 * @deprecated Use `provideTanStackQuery` instead.
 */
export function provideAngularQuery(
  queryClient: QueryClient,
): Array<Provider> {
  return provideTanStackQuery(queryClient)
}

const queryFeatures = ['Devtools', 'Hydration', 'PersistQueryClient'] as const

type QueryFeatureKind = (typeof queryFeatures)[number]

/**
 * Helper type to represent a Query feature.
 */
export interface QueryFeature<TFeatureKind extends QueryFeatureKind> {
  ɵkind: TFeatureKind
  ɵproviders: Array<Provider>
}

/**
 * Helper function to create an object that represents a Query feature.
 * @param kind -
 * @param providers -
 * @returns A Query feature.
 */
export function queryFeature<TFeatureKind extends QueryFeatureKind>(
  kind: TFeatureKind,
  providers: Array<Provider>,
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
 * Sets a non-default serialization key for this injector's `QueryClient` cache (server dehydrate /
 * browser hydrate via `TransferState`). Use this when you have multiple `QueryClient` instances
 * so each has its own key. The default key applies when you do not add this feature.
 *
 * ```ts
 * providers: [
 *   ...provideTanStackQuery(secondaryClient, withHydrationKey('my-secondary-query-cache')),
 * ]
 * ```
 *
 * @param key - A unique string for this client's `TransferState` entry.
 */
export function withHydrationKey(key: string): QueryFeature<'Hydration'> {
  return queryFeature('Hydration', [
    {
      provide: INTERNAL_TANSTACK_QUERY_HYDRATION_TRANSFER_KEY,
      useValue: makeStateKey<DehydratedState>(key),
    },
  ])
}

/**
 * Disables `TransferState` hydration and dehydration for the current environment injector.
 */
export function withNoQueryHydration(): QueryFeature<'Hydration'> {
  return queryFeature('Hydration', [
    {
      provide: INTERNAL_QUERY_CLIENT_SHOULD_HYDRATE,
      useValue: false,
    },
  ])
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
