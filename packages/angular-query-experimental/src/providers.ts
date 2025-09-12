import { DestroyRef, InjectionToken, inject } from '@angular/core'
import { QueryClient } from '@tanstack/query-core'
import type { Provider } from '@angular/core'

/**
 * Usually {@link provideTanStackQuery} is used once to set up TanStack Query and the
 * {@link https://tanstack.com/query/latest/docs/reference/QueryClient|QueryClient}
 * for the entire application. Internally it calls `provideQueryClient`.
 * You can use `provideQueryClient` to provide a different `QueryClient` instance for a part
 * of the application or for unit testing purposes.
 * @param queryClient - A `QueryClient` instance, or an `InjectionToken` which provides a `QueryClient`.
 * @returns a provider object that can be used to provide the `QueryClient` instance.
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
 * You can also enable optional developer tools by adding `withDevtools`. By
 * default the tools will then be loaded when your app is in development mode.
 * ```ts
 * import {
 *   provideTanStackQuery,
 *   withDevtools
 *   QueryClient,
 * } from '@tanstack/angular-query-experimental'
 *
 * bootstrapApplication(AppComponent,
 *   {
 *     providers: [
 *       provideTanStackQuery(new QueryClient(), withDevtools())
 *     ]
 *   }
 * )
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
 * providers: [provideTanStackQuery(MY_QUERY_CLIENT)]
 * ```
 * Using an InjectionToken for the QueryClient is an advanced optimization which allows TanStack Query to be absent from the main application bundle.
 * This can be beneficial if you want to include TanStack Query on lazy loaded routes only while still sharing a `QueryClient`.
 *
 * Note that this is a small optimization and for most applications it's preferable to provide the `QueryClient` in the main application config.
 * @param queryClient - A `QueryClient` instance, or an `InjectionToken` which provides a `QueryClient`.
 * @param features - Optional features to configure additional Query functionality.
 * @returns A set of providers to set up TanStack Query.
 * @see https://tanstack.com/query/v5/docs/framework/angular/quick-start
 * @see withDevtools
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
 * Allows to configure a `QueryClient`.
 * @param queryClient - A `QueryClient` instance.
 * @returns A set of providers to set up TanStack Query.
 * @see https://tanstack.com/query/v5/docs/framework/angular/quick-start
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
export type DeveloperToolsFeature = QueryFeature<'Devtools'>

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
export type QueryFeatures = DeveloperToolsFeature | PersistQueryClientFeature
