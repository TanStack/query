import {
  DestroyRef,
  ENVIRONMENT_INITIALIZER,
  inject,
  makeEnvironmentProviders,
} from '@angular/core'
import { onlineManager } from '@tanstack/query-core'
import { DOCUMENT } from '@angular/common'
import { QUERY_CLIENT, provideQueryClient } from './inject-query-client'
import { isDevMode } from './util/is-dev-mode/is-dev-mode'
import type { QueryClient } from '@tanstack/query-core'
import type { EnvironmentProviders, Provider } from '@angular/core'
import type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
} from '@tanstack/query-devtools'

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
 * @param queryClient - A `QueryClient` instance.
 * @param features - Optional features to configure additional Query functionality.
 * @returns A set of providers to set up TanStack Query.
 * @public
 * @see https://tanstack.com/query/v5/docs/framework/angular/quick-start
 * @see withDevtools
 */
export function provideTanStackQuery(
  queryClient: QueryClient,
  ...features: Array<QueryFeatures>
): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideQueryClient(queryClient),
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        queryClient.mount()
        // Unmount the query client on application destroy
        inject(DestroyRef).onDestroy(() => queryClient.unmount())
      },
    },
    features.map((feature) => feature.ɵproviders),
  ])
}

/**
 * Sets up providers necessary to enable TanStack Query functionality for Angular applications.
 *
 * Allows to configure a `QueryClient`.
 * @param queryClient - A `QueryClient` instance.
 * @returns A set of providers to set up TanStack Query.
 * @public
 * @see https://tanstack.com/query/v5/docs/framework/angular/quick-start
 * @deprecated Use `provideTanStackQuery` instead.
 */
export function provideAngularQuery(
  queryClient: QueryClient,
): EnvironmentProviders {
  return provideTanStackQuery(queryClient)
}

/**
 * Helper type to represent a Query feature.
 * @public
 */
export interface QueryFeature<TFeatureKind extends QueryFeatureKind> {
  ɵkind: TFeatureKind
  ɵproviders: Array<Provider>
}

/**
 * Helper function to create an object that represents a Query feature.
 * @param kind -
 * @param providers -
 */
function queryFeature<TFeatureKind extends QueryFeatureKind>(
  kind: TFeatureKind,
  providers: Array<Provider>,
): QueryFeature<TFeatureKind> {
  return { ɵkind: kind, ɵproviders: providers }
}

/**
 * A type alias that represents a feature which enables developer tools.
 * The type is used to describe the return value of the `withDevtools` function.
 * @public
 * @see {@link withDevtools}
 */
export type DeveloperToolsFeature = QueryFeature<'DeveloperTools'>

/**
 * Options for configuring the TanStack Query devtools.
 * @public
 */
export interface DeveloperToolsOptions {
  /**
   * Set this true if you want the dev tools to default to being open
   */
  initialIsOpen?: boolean
  /**
   * The position of the TanStack logo to open and close the devtools panel.
   * `top-left` | `top-right` | `bottom-left` | `bottom-right` | `relative`
   * Defaults to `bottom-right`.
   */
  buttonPosition?: DevtoolsButtonPosition
  /**
   * The position of the TanStack Query devtools panel.
   * `top` | `bottom` | `left` | `right`
   * Defaults to `bottom`.
   */
  position?: DevtoolsPosition
  /**
   * Custom instance of QueryClient
   */
  client?: QueryClient
  /**
   * Use this so you can define custom errors that can be shown in the devtools.
   */
  errorTypes?: Array<DevtoolsErrorType>
  /**
   * Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
   */
  styleNonce?: string
  /**
   * Use this so you can attach the devtool's styles to a specific element in the DOM.
   */
  shadowDOMTarget?: ShadowRoot

  /**
   * Whether the developer tools should load.
   * - `auto`- (Default) Lazily loads dev tools when in development mode. Skips loading in production mode.
   * - `always`- Always load the dev tools, regardless of the environment.
   * - `never`- Never load the dev tools, regardless of the environment.
   *
   * You can use `always` and `never` to override loading developer tools from an environment file.
   * For example, a test environment might run in production mode but you may want to load developer tools.
   */
  loadingMode?: 'auto' | 'always' | 'never'
}

/**
 * Adds developer tools.
 * @param options
 * @see `provideTanStackQuery`
 */

/**
 * Enables developer tools.
 *
 * **Example**
 *
 * ```ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideTanStackQuery(new QueryClient(), withDevtools())
 *   ]
 * }
 *
 * ```
 *
 * If you need more programmatic control over the developer tools, consider `injectDevtoolsPanel`
 * For example: loading and unloading on keyboard events, multiple independent instances during application lifetime, or rendering
 * the tools inside your own developer tools.
 *
 * @param options - Set of configuration parameters to customize the developer tools, see
 *     `DeveloperToolsOptions` for additional information.
 * @returns A set of providers for use with `provideTanStackQuery`.
 * @public
 * @see {@link provideTanStackQuery}
 * @see {@link DeveloperToolsOptions}
 */
export function withDevtools(
  options: DeveloperToolsOptions = {},
): DeveloperToolsFeature {
  let providers: Array<Provider> = []
  if (
    (isDevMode() && options.loadingMode !== 'never') ||
    options.loadingMode === 'always'
  ) {
    providers = [
      {
        provide: ENVIRONMENT_INITIALIZER,
        multi: true,
        useFactory: () => {
          return () => {
            const doc = inject(DOCUMENT)
            const destroyRef = inject(DestroyRef)
            const el = doc.body.appendChild(document.createElement('div'))
            el.classList.add('tsqd-parent-container')
            const client = inject(QUERY_CLIENT)
            import('@tanstack/query-devtools').then((queryDevtools) => {
              const devtools = new queryDevtools.TanstackQueryDevtools({
                ...options,
                client,
                queryFlavor: 'Angular Query',
                version: '5',
                onlineManager,
              })
              // Unmount the devtools on application destroy
              destroyRef.onDestroy(() => {
                devtools.unmount()
              })
              devtools.mount(el)
            })
          }
        },
      },
    ]
  } else {
    providers = []
  }
  return queryFeature('DeveloperTools', providers)
}

/**
 * A type alias that represents all Query features available for use with `provideTanStackQuery`.
 * Features can be enabled by adding special functions to the `provideTanStackQuery` call.
 * See documentation for each symbol to find corresponding function name. See also `provideTanStackQuery`
 * documentation on how to use those functions.
 * @public
 * @see {@link provideTanStackQuery}
 */
export type QueryFeatures = DeveloperToolsFeature // Union type of features but just one now

export const queryFeatures = ['DeveloperTools'] as const

export type QueryFeatureKind = (typeof queryFeatures)[number]
