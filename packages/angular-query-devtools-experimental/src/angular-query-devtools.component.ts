import { isPlatformBrowser } from '@angular/common'
import * as queryDevtools from '@tanstack/query-devtools'
import {
  injectQueryClient,
  onlineManager,
} from '@tanstack/angular-query-experimental'
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  PLATFORM_ID,
  ViewChild,
  booleanAttribute,
  inject,
} from '@angular/core'
import { QueryClient } from '@tanstack/angular-query-experimental'
import type {
  AfterViewInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core'
import type {
  DevToolsErrorType,
  TanstackQueryDevtools,
} from '@tanstack/query-devtools'

@Component({
  selector: 'angular-query-devtools',
  standalone: true,
  template: `<div class="tsqd-parent-container" #ref></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { ngSkipHydration: 'true' },
})
export class AngularQueryDevtools
  implements AfterViewInit, OnChanges, OnDestroy
{
  /*
   * It is intentional that there are no default values on inputs.
   * Core devtools will set defaults when values are undefined.
   * */

  /**
   * Add this attribute if you want the dev tools to default to being open
   * @example
   * <angular-query-devtools initialIsOpen />
   */
  @Input({ transform: booleanAttribute }) initialIsOpen?: boolean

  /**
   * The position of the TanStack logo to open and close the devtools panel.
   * `top-left` | `top-right` | `bottom-left` | `bottom-right` | `relative`
   * Defaults to `bottom-right`.
   * If `relative`, the button is placed in the location that you render the devtools.
   * @example
   * <angular-query-devtools buttonPosition="top-right" />
   */
  @Input() buttonPosition?: queryDevtools.DevtoolsButtonPosition

  /**
   * The position of the Angular Query devtools panel.
   * `top` | `bottom` | `left` | `right`
   * Defaults to `bottom`.
   * @example
   * <angular-query-devtools position="bottom" />
   */
  @Input() position?: queryDevtools.DevtoolsPosition

  /**
   * Custom instance of QueryClient
   * @example
   * <angular-query-devtools [client]="queryClient" />
   */
  @Input() client?: QueryClient

  /**
   * Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
   * @example
   * <angular-query-devtools styleNonce="YourRandomNonceValue" />
   */
  @Input() styleNonce?: string

  /**
   * Use this so you can define custom errors that can be shown in the devtools.
   */
  @Input() errorTypes?: Array<DevToolsErrorType>

  @ViewChild('ref') ref!: ElementRef

  #devtools?: TanstackQueryDevtools

  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID))

  readonly #injectedClient: QueryClient | null = this.#isBrowser
    ? injectQueryClient({
        optional: true,
      })
    : null

  ngOnChanges(changes: SimpleChanges) {
    if (!this.#devtools) return
    if (changes['client']) {
      this.#devtools.setClient(this.#getAppliedQueryClient())
    }
    if (changes['buttonPosition'] && this.buttonPosition !== undefined) {
      this.#devtools.setButtonPosition(this.buttonPosition)
    }
    if (changes['position'] && this.position !== undefined) {
      this.#devtools.setPosition(this.position)
    }
    if (changes['initialIsOpen'] && this.initialIsOpen !== undefined) {
      this.#devtools.setInitialIsOpen(this.initialIsOpen)
    }
    if (changes['errorTypes'] && this.errorTypes !== undefined) {
      this.#devtools.setErrorTypes(this.errorTypes)
    }
  }

  ngAfterViewInit() {
    if (!this.#isBrowser) return
    const devtools = new queryDevtools.TanstackQueryDevtools({
      client: this.#getAppliedQueryClient(),
      queryFlavor: 'Angular Query',
      version: '5',
      onlineManager,
      buttonPosition: this.buttonPosition,
      position: this.position,
      initialIsOpen: this.initialIsOpen,
      errorTypes: this.errorTypes,
      styleNonce: this.styleNonce,
    })
    devtools.mount(this.ref.nativeElement)
    this.#devtools = devtools
  }

  ngOnDestroy() {
    this.#devtools?.unmount()
  }

  #getAppliedQueryClient() {
    const client = this.client ?? this.#injectedClient
    if (!client) {
      throw new Error(
        'You must either provide a client via `provideAngularQuery` ' +
          'or pass it to the `client` attribute of `<angular-query-devtools>`.',
      )
    }
    return client
  }
}
