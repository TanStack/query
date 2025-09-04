import {
  DestroyRef,
  ENVIRONMENT_INITIALIZER,
  InjectionToken,
  PLATFORM_ID,
  computed,
  effect,
  inject,
} from '@angular/core'
import { QueryClient, noop, onlineManager } from '@tanstack/query-core'
import { isPlatformBrowser } from '@angular/common'
import { isDevMode } from './util/is-dev-mode/is-dev-mode'
import type { Provider } from '@angular/core'
import type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
  TanstackQueryDevtools,
} from '@tanstack/query-devtools'

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
 * } from '@tanstack/angular-query'
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
 * } from '@tanstack/angular-query'
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
 * } from '@tanstack/angular-query'
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
 * @public
 * @see {@link withDevtools}
 */
export type DeveloperToolsFeature = QueryFeature<'DeveloperTools'>

/**
 * A type alias that represents a feature which enables persistence.
 * The type is used to describe the return value of the `withPersistQueryClient` function.
 * @public
 */
export type PersistQueryClientFeature = QueryFeature<'PersistQueryClient'>

/**
 * Options for configuring the TanStack Query devtools.
 * @public
 */
export interface DevtoolsOptions {
  /**
   * Set this true if you want the devtools to default to being open
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
   * Set this to true to hide disabled queries from the devtools panel.
   */
  hideDisabledQueries?: boolean

  /**
   * Whether the developer tools should load.
   * - `auto`- (Default) Lazily loads devtools when in development mode. Skips loading in production mode.
   * - `true`- Always load the devtools, regardless of the environment.
   * - `false`- Never load the devtools, regardless of the environment.
   *
   * You can use `true` and `false` to override loading developer tools from an environment file.
   * For example, a test environment might run in production mode but you may want to load developer tools.
   *
   * Additionally, you can use a signal in the callback to dynamically load the devtools based on a condition. For example,
   * a signal created from a RxJS observable that listens for a keyboard shortcut.
   *
   * **Example**
   * ```ts
   *    withDevtools(() => ({
   *      initialIsOpen: true,
   *      loadDevtools: inject(ExampleService).loadDevtools()
   *    }))
   *  ```
   */
  loadDevtools?: 'auto' | boolean
}

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
 * ```
 * By default the devtools will be loaded when Angular runs in development mode and rendered in `<body>`.
 *
 * If you need more control over when devtools are loaded, you can use the `loadDevtools` option. This is particularly useful if you want to load devtools based on environment configurations. For instance, you might have a test environment running in production mode but still require devtools to be available.
 *
 * If you need more control over where devtools are rendered, consider `injectDevtoolsPanel`. This allows rendering devtools inside your own devtools for example.
 * @param withDevtoolsFn - A function that returns `DevtoolsOptions`.
 * @returns A set of providers for use with `provideTanStackQuery`.
 * @public
 * @see {@link provideTanStackQuery}
 * @see {@link DevtoolsOptions}
 */
export function withDevtools(
  withDevtoolsFn?: () => DevtoolsOptions,
): DeveloperToolsFeature {
  let providers: Array<Provider> = []
  if (!isDevMode() && !withDevtoolsFn) {
    providers = []
  } else {
    providers = [
      {
        // Do not use provideEnvironmentInitializer while Angular < v19 is supported
        provide: ENVIRONMENT_INITIALIZER,
        multi: true,
        useFactory: () => {
          if (!isPlatformBrowser(inject(PLATFORM_ID))) return noop
          const injectedClient = inject(QueryClient, {
            optional: true,
          })
          const destroyRef = inject(DestroyRef)

          const options = computed(() => withDevtoolsFn?.() ?? {})

          let devtools: TanstackQueryDevtools | null = null
          let el: HTMLElement | null = null

          const shouldLoadToolsSignal = computed(() => {
            const { loadDevtools } = options()
            return typeof loadDevtools === 'boolean'
              ? loadDevtools
              : isDevMode()
          })

          const getResolvedQueryClient = () => {
            const client = options().client ?? injectedClient
            if (!client) {
              throw new Error('No QueryClient found')
            }
            return client
          }

          const destroyDevtools = () => {
            devtools?.unmount()
            el?.remove()
            devtools = null
          }

          return () =>
            effect(() => {
              const shouldLoadTools = shouldLoadToolsSignal()
              const {
                client,
                position,
                errorTypes,
                buttonPosition,
                initialIsOpen,
              } = options()

              if (devtools && !shouldLoadTools) {
                destroyDevtools()
                return
              } else if (devtools && shouldLoadTools) {
                client && devtools.setClient(client)
                position && devtools.setPosition(position)
                errorTypes && devtools.setErrorTypes(errorTypes)
                buttonPosition && devtools.setButtonPosition(buttonPosition)
                initialIsOpen && devtools.setInitialIsOpen(initialIsOpen)
                return
              } else if (!shouldLoadTools) {
                return
              }

              el = document.body.appendChild(document.createElement('div'))
              el.classList.add('tsqd-parent-container')

              import('@tanstack/query-devtools').then((queryDevtools) => {
                devtools = new queryDevtools.TanstackQueryDevtools({
                  ...options(),
                  client: getResolvedQueryClient(),
                  queryFlavor: 'Angular Query',
                  version: '5',
                  onlineManager,
                })

                el && devtools.mount(el)

                // Unmount the devtools on application destroy
                destroyRef.onDestroy(destroyDevtools)
              })
            })
        },
      },
    ]
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
export type QueryFeatures = DeveloperToolsFeature | PersistQueryClientFeature

export const queryFeatures = ['DeveloperTools', 'PersistQueryClient'] as const

export type QueryFeatureKind = (typeof queryFeatures)[number]
