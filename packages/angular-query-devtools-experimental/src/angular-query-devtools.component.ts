import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  Input,
  Optional,
  ViewChild,
  booleanAttribute,
} from '@angular/core'
import { TanstackQueryDevtools } from '@tanstack/query-devtools'
import {
  UseQueryClient,
  onlineManager,
} from '@tanstack/angular-query-experimental'
import type { QueryClient } from '@tanstack/angular-query-experimental'
import type { AfterViewInit, OnDestroy } from '@angular/core'
import type {
  DevToolsErrorType as DevToolsErrorTypeOriginal,
  DevtoolsButtonPosition as DevtoolsButtonPositionOriginal,
  DevtoolsPosition as DevtoolsPositionOriginal,
} from '@tanstack/query-devtools'

// Alias types for decorators
type DevtoolsButtonPosition = DevtoolsButtonPositionOriginal
type DevtoolsPosition = DevtoolsPositionOriginal
type DevToolsErrorType = DevToolsErrorTypeOriginal

@Component({
  selector: 'angular-query-devtools',
  standalone: true,
  template: `<div class="tsqd-parent-container" #ref></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AngularQueryDevtoolsComponent implements AfterViewInit, OnDestroy {
  readonly #injectedClient: QueryClient | undefined
  #devtools: TanstackQueryDevtools | undefined

  constructor(
    @Optional() @Inject(UseQueryClient) queryClient: QueryClient | undefined,
  ) {
    if (queryClient) {
      this.#injectedClient = queryClient
    }
  }

  @ViewChild('ref') ref!: ElementRef

  /**
   * Set this true if you want the dev tools to default to being open
   */
  @Input({ transform: booleanAttribute }) initialIsOpen = false

  /**
   * The position of the TanStack logo to open and close the devtools panel.
   * 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
   * Defaults to 'bottom-left'.
   */
  @Input() buttonPosition: DevtoolsButtonPosition = 'bottom-left'

  /**
   * The position of the Angular Query devtools panel.
   * 'top' | 'bottom' | 'left' | 'right'
   * Defaults to 'bottom'.
   */
  @Input() position: DevtoolsPosition = 'bottom'

  /**
   * Custom instance of QueryClient
   */
  @Input() client: QueryClient | undefined

  /**
   * Use this so you can define custom errors that can be shown in the devtools.
   */
  @Input() errorTypes: Array<DevToolsErrorType> = []

  ngAfterViewInit() {
    const client = this.client || this.#injectedClient
    if (!client) {
      throw new Error(
        `No query client found. Make sure to call provideAngularQuery or use the client attribute on <angular-query-devtools>`,
      )
    }

    const { buttonPosition, position, initialIsOpen, errorTypes } = this
    this.#devtools = new TanstackQueryDevtools({
      client,
      queryFlavor: 'Angular Query',
      version: '5',
      onlineManager,
      buttonPosition,
      position,
      initialIsOpen,
      errorTypes,
    })
    this.#devtools.mount(this.ref.nativeElement)
  }

  ngOnDestroy() {
    this.#devtools?.unmount()
  }
}
