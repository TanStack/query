import { isPlatformBrowser } from '@angular/common'
import {
  DestroyRef,
  InjectionToken,
  PLATFORM_ID,
  afterNextRender,
  afterRenderEffect,
  inject,
  isDevMode,
  isSignal,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core'
import { queryFeature } from '@tanstack/angular-query/internal'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import { TanstackQueryDevtools } from '@tanstack/query-devtools'
import type { Signal } from '@angular/core'
import type { DevtoolsOptions, WithDevtools } from './types'

/**
 * Internal token used to prevent double providing of devtools in child injectors
 */
const DEVTOOLS_PROVIDED = new InjectionToken('', {
  factory: () => ({
    isProvided: false,
  }),
})

/** Internal token for providing devtools options. */
const DEVTOOLS_OPTIONS = new InjectionToken<DevtoolsOptions>('')

function resolveOption<T>(option: T | Signal<T | undefined> | undefined) {
  return isSignal(option) ? option() : option
}

/**
 * Enables developer tools in Angular development builds.
 *
 * **Example**
 *
 * ```ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideTanStackQuery(() => new QueryClient(), withDevtools()),
 *   ]
 * }
 * ```
 * The devtools will be rendered in `<body>`.
 *
 * If you need more control over when devtools are loaded, you can use the `loadDevtools` option.
 *
 * If you need more control over where devtools are rendered, consider `injectDevtoolsPanel`. This allows rendering devtools inside your own devtools for example.
 * @param withDevtoolsFn - A function that returns `DevtoolsOptions`. It runs
 * once in an Angular injection context and can call `inject()`. Return signals
 * as individual mutable option values to update them reactively.
 * @returns A set of providers for use with `provideTanStackQuery`.
 * @see {@link provideTanStackQuery}
 * @see {@link DevtoolsOptions}
 */
export const withDevtools: WithDevtools = (withDevtoolsFn) =>
  queryFeature(
    makeEnvironmentProviders([
      {
        provide: DEVTOOLS_OPTIONS,
        useFactory: () => withDevtoolsFn?.() ?? {},
      },
      provideEnvironmentInitializer(() => {
        const devtoolsProvided = inject(DEVTOOLS_PROVIDED)
        if (
          !isPlatformBrowser(inject(PLATFORM_ID)) ||
          devtoolsProvided.isProvided
        )
          return

        devtoolsProvided.isProvided = true

        const destroyRef = inject(DestroyRef)
        const injectedClient = inject(QueryClient, { optional: true })
        const options = inject(DEVTOOLS_OPTIONS)
        const client = resolveOption(options.client) ?? injectedClient

        if (!client) throw new Error('No QueryClient found')

        const devtools = new TanstackQueryDevtools({
          client,
          queryFlavor: 'Angular Query',
          version: '5',
          onlineManager,
          buttonPosition: resolveOption(options.buttonPosition),
          position: resolveOption(options.position),
          initialIsOpen: resolveOption(options.initialIsOpen),
          errorTypes: resolveOption(options.errorTypes),
          styleNonce: options.styleNonce,
          shadowDOMTarget: options.shadowDOMTarget,
          hideDisabledQueries: options.hideDisabledQueries,
          theme: resolveOption(options.theme),
        })

        let renderCompleted = false
        let element: HTMLElement | null = null

        const shouldMount = () => {
          const loadDevtools = resolveOption(options.loadDevtools)
          return typeof loadDevtools === 'boolean' ? loadDevtools : isDevMode()
        }

        const mount = () => {
          if (element || !renderCompleted || !shouldMount()) return

          element = document.body.appendChild(document.createElement('div'))
          element.classList.add('tsqd-parent-container')
          devtools.mount(element)
        }

        const unmount = () => {
          if (!element) return

          devtools.unmount()
          element.remove()
          element = null
        }

        afterNextRender({
          write: () => {
            if (destroyRef.destroyed) return

            renderCompleted = true
            mount()
            destroyRef.onDestroy(unmount)
          },
        })

        afterRenderEffect({
          write: () => {
            if (!renderCompleted) return
            shouldMount() ? mount() : unmount()
          },
        })

        const registerOptionEffect = <T>(
          option: T | Signal<T | undefined> | undefined,
          update: (value: T | undefined) => void,
        ) => {
          if (!isSignal(option)) return
          afterRenderEffect({
            write: () => {
              update(option())
            },
          })
        }

        registerOptionEffect(options.client, (value) => {
          devtools.setClient(value ?? injectedClient!)
        })
        registerOptionEffect(options.buttonPosition, (value) => {
          devtools.setButtonPosition(value ?? 'bottom-right')
        })
        registerOptionEffect(options.position, (value) => {
          devtools.setPosition(value ?? 'bottom')
        })
        registerOptionEffect(options.initialIsOpen, (value) => {
          devtools.setInitialIsOpen(value ?? false)
        })
        registerOptionEffect(options.errorTypes, (value) => {
          devtools.setErrorTypes(value ?? [])
        })
        registerOptionEffect(options.theme, (value) => {
          devtools.setTheme(value)
        })
      }),
    ]),
  )
