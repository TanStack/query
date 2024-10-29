import {
  DestroyRef,
  Injector,
  PLATFORM_ID,
  assertInInjectionContext,
  effect,
  inject,
  isSignal,
  runInInjectionContext,
  untracked,
} from '@angular/core'
import { TanstackQueryDevtoolsPanel } from '@tanstack/query-devtools'
import {
  injectQueryClient,
  onlineManager,
} from '@tanstack/angular-query-experimental'
import { isPlatformBrowser } from '@angular/common'
import type { QueryClient } from '@tanstack/angular-query-experimental'
import type { ElementRef, Signal } from '@angular/core'
import type { DevtoolsErrorType } from '@tanstack/query-devtools'

/**
 * Inject a TanStack Query devtools panel and render it in the DOM.
 *
 * Devtools panel allows programmatic control over the devtools, for example if you want to render
 * the devtools as part of your own devtools.
 *
 * Consider `withDeveloperTools` instead if you don't need this.
 * @param options - A set of options to setup the devtools panel
 * @returns DevtoolsPanelRef
 * @see https://tanstack.com/query/v5/docs/framework/angular/devtools
 */
export function injectDevtoolsPanel(
  options: DevtoolsPanelOptions,
): DevtoolsPanelRef {
  !options.injector && assertInInjectionContext(injectDevtoolsPanel)
  const injector = options.injector ?? inject(Injector)

  return runInInjectionContext(injector, () => {
    let devtools: TanstackQueryDevtoolsPanel | null = null

    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID))

    const destroy = () => {
      devtools?.unmount()
      devtools = null
    }

    if (!isBrowser)
      return {
        destroy,
      }

    const destroyRef = inject(DestroyRef)

    const onSignalChange = <T>(
      signal: Signal<T>,
      callback: (value: NonNullable<T>) => void,
    ) => {
      const effectOnSecondChange = () => {
        let isFirstRun = true

        effect(() => {
          const value = signal()

          if (isFirstRun) {
            isFirstRun = false
            return
          }

          untracked(() => {
            if (devtools && value) {
              callback(value)
            }
          })
        })
      }
      return effectOnSecondChange()
    }

    const getAppliedQueryClient = () => {
      const injectedClient = injectQueryClient({
        optional: true,
        injector,
      }) as QueryClient | null
      const client = isSignal(options.client)
        ? options.client()
        : (options.client ?? injectedClient)
      if (!client) {
        throw new Error('No QueryClient found')
      }
      return client
    }

    const getErrorTypes = () => {
      return isSignal(options.errorTypes)
        ? options.errorTypes()
        : (options.errorTypes ?? [])
    }

    if (isSignal(options.client)) {
      onSignalChange(options.client, (value) => {
        devtools!.setClient(value)
      })
    }

    if (isSignal(options.errorTypes)) {
      onSignalChange(options.errorTypes, (value) => {
        devtools!.setErrorTypes(value)
      })
    }

    effect(() => {
      if (!isSignal(options.hostElement)) return
      const hostElement = options.hostElement()

      untracked(() => {
        if (!devtools && hostElement) {
          devtools = new TanstackQueryDevtoolsPanel({
            client: getAppliedQueryClient(),
            queryFlavor: 'Angular Query',
            version: '5',
            buttonPosition: 'bottom-left',
            position: 'bottom',
            initialIsOpen: true,
            errorTypes: getErrorTypes(),
            styleNonce: options.styleNonce,
            shadowDOMTarget: options.shadowDOMTarget,
            onClose: options.onClose,
            onlineManager,
          })
          devtools.mount(hostElement.nativeElement)
        } else if (devtools && !hostElement) {
          destroy()
        }
      })
    })

    destroyRef.onDestroy(destroy)

    return {
      destroy,
    }
  })
}

/**
 * A devtools panel, which can be manually destroyed.
 */
export interface DevtoolsPanelRef {
  /**
   * Destroy the panel, removing it from the DOM and stops listening to signal changes.
   */
  destroy: () => void
}

export interface DevtoolsPanelOptions {
  /**
   * Custom instance of QueryClient
   */
  client?: QueryClient | Signal<QueryClient>
  /**
   * Use this so you can define custom errors that can be shown in the devtools.
   */
  errorTypes?: Array<DevtoolsErrorType> | Signal<Array<DevtoolsErrorType>>
  /**
   * Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
   */
  styleNonce?: string
  /**
   * Use this so you can attach the devtool's styles to specific element in the DOM.
   */
  shadowDOMTarget?: ShadowRoot

  /**
   * Callback function that is called when the devtools panel is closed
   */
  onClose?: () => unknown

  /**
   * Element where to render the devtools panel. When set to undefined or null, the devtools panel will not be created, or destroyed if existing.
   * If changed from undefined to a ElementRef, the devtools panel will be created.
   */
  hostElement: ElementRef | Signal<ElementRef | undefined>

  /**
   * Custom injector to use for the devtools panel.
   */
  injector?: Injector
}
