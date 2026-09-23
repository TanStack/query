import { DestroyRef, InjectionToken, inject } from '@angular/core'
import { QueryClient } from '@tanstack/query-core'
import type { Provider } from '@angular/core'

/**
 * Usually {@link provideTanStackQuery} is used once to set up TanStack Query and the
 * [`QueryClient`](https://tanstack.com/query/latest/docs/reference/QueryClient) for the entire application —
 * it calls `provideQueryClient` internally. Use `provideQueryClient` directly to provide a different
 * `QueryClient` instance for part of the application, or for unit testing.
 * @param queryClient - A `QueryClient` instance, or an `InjectionToken` which provides a `QueryClient`.
 * @returns A provider object that can be used to provide the `QueryClient` instance.
 *
 * @example
 * Providing a test-only `QueryClient` in a component test, without wiring up `provideTanStackQuery`'s other
 * defaults:
 * ```ts
 * TestBed.configureTestingModule({
 *   providers: [provideQueryClient(new QueryClient())],
 * })
 * ```
 */
export function provideQueryClient(
  queryClient: QueryClient | InjectionToken<QueryClient>,
): Provider {
  return {
    provide: QueryClient,
    useFactory: () => {
      const client =
        queryClient instanceof InjectionToken
          ? inject(queryClient)
          : queryClient
      // Unmount the query client on injector destroy
      inject(DestroyRef).onDestroy(() => client.unmount())
      client.mount()
      return client
    },
  }
}

/**
 * Sets up providers necessary to enable TanStack Query functionality for Angular applications. Allows
 * configuring a `QueryClient` and optional features such as developer tools.
 *
 * @see https://tanstack.com/query/v5/docs/framework/angular/quick-start
 * @see {@link withDevtools}
 * @param queryClient - A `QueryClient` instance, or an `InjectionToken` which provides a `QueryClient`.
 * @param features - Optional features to configure additional Query functionality.
 * @returns A set of providers to set up TanStack Query.
 *
 * @example
 * ```ts
 * import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental'
 *
 * bootstrapApplication(AppComponent, {
 *   providers: [provideTanStackQuery(new QueryClient())],
 * })
 * ```
 *
 * @example
 * The same, in an `NgModule`-based application:
 * ```ts
 * import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental'
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
 * @example
 * Enabling optional developer tools by adding `withDevtools` — by default, the tools are then loaded when
 * your app is in development mode:
 * ```ts
 * import {
 *   provideTanStackQuery,
 *   withDevtools,
 *   QueryClient,
 * } from '@tanstack/angular-query-experimental'
 *
 * bootstrapApplication(AppComponent, {
 *   providers: [provideTanStackQuery(new QueryClient(), withDevtools())],
 * })
 * ```
 *
 * @example
 * Using an `InjectionToken` for the `QueryClient` — an advanced optimization that lets TanStack Query be
 * absent from the main application bundle, useful for including it on lazy-loaded routes only while still
 * sharing a `QueryClient`. This is a small optimization; for most applications it's preferable to provide
 * the `QueryClient` in the main application config, as in the examples above:
 * ```ts
 * export const MY_QUERY_CLIENT = new InjectionToken('', {
 *   factory: () => new QueryClient(),
 * })
 *
 * // In a lazy loaded route or lazy loaded component's providers array:
 * providers: [provideTanStackQuery(MY_QUERY_CLIENT)]
 * ```
 */
export function provideTanStackQuery(
  queryClient: QueryClient | InjectionToken<QueryClient>,
  ...features: Array<QueryFeatures>
): Array<Provider> {
  return [
    provideQueryClient(queryClient),
    features.map((feature) => feature.ɵproviders),
  ]
}

/**
 * Sets up providers necessary to enable TanStack Query functionality for Angular applications.
 *
 * Allows configuring a `QueryClient`.
 * @see https://tanstack.com/query/v5/docs/framework/angular/quick-start
 * @param queryClient - A `QueryClient` instance.
 * @returns A set of providers to set up TanStack Query.
 * @deprecated Use `provideTanStackQuery` instead.
 */
export function provideAngularQuery(queryClient: QueryClient): Array<Provider> {
  return provideTanStackQuery(queryClient)
}

const queryFeatures = ['Devtools', 'PersistQueryClient'] as const

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
 * @param kind - The kind of feature, e.g. `'Devtools'`.
 * @param providers - The Angular providers this feature contributes to `provideTanStackQuery`.
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
 * A type alias that represents all Query features available for use with `provideTanStackQuery`.
 * Features can be enabled by adding special functions to the `provideTanStackQuery` call.
 * See documentation for each symbol to find corresponding function name. See also `provideTanStackQuery`
 * documentation on how to use those functions.
 * @see {@link provideTanStackQuery}
 */
export type QueryFeatures = DevtoolsFeature | PersistQueryClientFeature
