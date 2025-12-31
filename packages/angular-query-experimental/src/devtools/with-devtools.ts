import { isPlatformBrowser } from '@angular/common'
import {
  DestroyRef,
  InjectionToken,
  Injector,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  isDevMode,
  provideEnvironmentInitializer,
} from '@angular/core'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import { queryFeature } from '../providers'
import type { Signal } from '@angular/core'
import type {
  DevtoolsOptions,
  WithDevtools,
  WithDevtoolsFn,
  WithDevtoolsOptions,
} from './types'
import type { TanstackQueryDevtools } from '@tanstack/query-devtools'

/**
 * Internal token used to prevent double providing of devtools in child injectors
 */
const DEVTOOLS_PROVIDED = new InjectionToken('', {
  factory: () => ({
    isProvided: false,
  }),
})

/**
 * Internal token for providing devtools options
 */
const DEVTOOLS_OPTIONS_SIGNAL = new InjectionToken<Signal<DevtoolsOptions>>('')

/**
 * Enables developer tools in Angular development builds.
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
 * The devtools will be rendered in `<body>`.
 *
 * If you need more control over when devtools are loaded, you can use the `loadDevtools` option.
 *
 * If you need more control over where devtools are rendered, consider `injectDevtoolsPanel`. This allows rendering devtools inside your own devtools for example.
 * @param withDevtoolsFn - A function that returns `DevtoolsOptions`.
 * @param options - Additional options for configuring `withDevtools`.
 * @returns A set of providers for use with `provideTanStackQuery`.
 * @see {@link provideTanStackQuery}
 * @see {@link DevtoolsOptions}
 */
export const withDevtools: WithDevtools = (
  withDevtoolsFn?: WithDevtoolsFn,
  options: WithDevtoolsOptions = {},
) =>
  queryFeature('Devtools', [
    {
      provide: DEVTOOLS_OPTIONS_SIGNAL,
      useFactory: (...deps: Array<any>) =>
        computed(() => withDevtoolsFn?.(...deps) ?? {}),
      deps: options.deps || [],
    },
    provideEnvironmentInitializer(() => {
      const devtoolsProvided = inject(DEVTOOLS_PROVIDED)
      if (
        !isPlatformBrowser(inject(PLATFORM_ID)) ||
        devtoolsProvided.isProvided
      )
        return

      devtoolsProvided.isProvided = true
      let injectorIsDestroyed = false
      inject(DestroyRef).onDestroy(() => (injectorIsDestroyed = true))

      const injectedClient = inject(QueryClient, {
        optional: true,
      })
      const destroyRef = inject(DestroyRef)
      const devtoolsOptions = inject(DEVTOOLS_OPTIONS_SIGNAL)
      const injector = inject(Injector)

      let devtools: TanstackQueryDevtools | null = null
      let el: HTMLElement | null = null

      const shouldLoadToolsSignal = computed(() => {
        const { loadDevtools } = devtoolsOptions()
        return typeof loadDevtools === 'boolean' ? loadDevtools : isDevMode()
      })

      const getResolvedQueryClient = () => {
        const client = devtoolsOptions().client ?? injectedClient
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

      effect(
        () => {
          const shouldLoadTools = shouldLoadToolsSignal()
          const {
            client,
            position,
            errorTypes,
            buttonPosition,
            initialIsOpen,
          } = devtoolsOptions()

          if (!shouldLoadTools) {
            // Destroy or do nothing
            devtools && destroyDevtools()
            return
          }

          if (devtools) {
            // Update existing devtools config
            client && devtools.setClient(client)
            position && devtools.setPosition(position)
            errorTypes && devtools.setErrorTypes(errorTypes)
            buttonPosition && devtools.setButtonPosition(buttonPosition)
            typeof initialIsOpen === 'boolean' &&
              devtools.setInitialIsOpen(initialIsOpen)
            return
          }

          // Create devtools
          import('@tanstack/query-devtools')
            .then((queryDevtools) => {
              // As this code runs async, the injector could have been destroyed
              if (injectorIsDestroyed) return

              devtools = new queryDevtools.TanstackQueryDevtools({
                ...devtoolsOptions(),
                client: getResolvedQueryClient(),
                queryFlavor: 'Angular Query',
                version: '5',
                onlineManager,
              })

              el = document.body.appendChild(document.createElement('div'))
              el.classList.add('tsqd-parent-container')
              devtools.mount(el)

              destroyRef.onDestroy(destroyDevtools)
            })
            .catch((error) => {
              console.error(
                'Install @tanstack/query-devtools or reinstall without --omit=optional.',
                error,
              )
            })
        },
        { injector },
      )
    }),
  ])
