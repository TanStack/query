import { TanstackQueryDevtools } from '@tanstack/query-devtools'
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  ViewChild,
  booleanAttribute,
} from '@angular/core'
import {
  injectQueryClient,
  onlineManager,
} from '@tanstack/angular-query-experimental'
import type { QueryClient } from '@tanstack/angular-query-experimental'
import type { AfterViewInit, OnDestroy } from '@angular/core'
import type {
  // DevToolsErrorType as DevToolsErrorTypeOriginal,
  DevtoolsButtonPosition as DevtoolsButtonPositionOriginal,
  DevtoolsPosition as DevtoolsPositionOriginal,
} from '@tanstack/query-devtools'

// Alias types for decorators
type DevtoolsButtonPosition = DevtoolsButtonPositionOriginal
type DevtoolsPosition = DevtoolsPositionOriginal
// type DevToolsErrorType = DevToolsErrorTypeOriginal

@Component({
  selector: 'angular-query-devtools',
  standalone: true,
  template: `<div class="tsqd-parent-container" #ref></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AngularQueryDevtoolsComponent implements AfterViewInit, OnDestroy {
  readonly #injectedClient: QueryClient | null
  #clientFromAttribute: QueryClient | null = null
  #devtools: TanstackQueryDevtools | undefined

  constructor() {
    this.#injectedClient = injectQueryClient({
      optional: true,
    })
  }

  @ViewChild('ref') ref!: ElementRef

  #initialIsOpen = false
  /**
   * Add this attribute if you want the dev tools to default to being open
   */
  @Input({ transform: booleanAttribute })
  set initialIsOpen(value: boolean) {
    this.#initialIsOpen = value
    this.#devtools?.setInitialIsOpen(value)
  }
  get initialIsOpen() {
    return this.#initialIsOpen
  }

  #buttonPosition: DevtoolsButtonPosition = 'bottom-left'
  /**
   * The position of the TanStack logo to open and close the devtools panel.
   * 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
   * Defaults to 'bottom-left'.
   */
  @Input()
  set buttonPosition(value: DevtoolsButtonPosition) {
    this.#buttonPosition = value
    this.#devtools?.setButtonPosition(value)
  }
  get buttonPosition() {
    return this.#buttonPosition
  }

  #position: DevtoolsPosition = 'bottom'
  /**
   * The position of the Angular Query devtools panel.
   * 'top' | 'bottom' | 'left' | 'right'
   * Defaults to 'bottom'.
   */
  @Input()
  set position(value: DevtoolsPosition) {
    this.#position = value
    this.#devtools?.setPosition(value)
  }
  get position() {
    return this.#position
  }

  /**
   * Custom instance of QueryClient
   */
  @Input()
  set client(client: QueryClient | undefined) {
    this.#clientFromAttribute = client ?? null
    this.#devtools?.setClient(this.#getAppliedQueryClient())
  }

  // TODO: needs to tested. When re-adding don't forget to re-add to devtools.md too
  // #errorTypes: Array<DevToolsErrorType> = []
  /**
   * Use this so you can define custom errors that can be shown in the devtools.
   */
  // @Input()
  // set errorTypes(value: Array<DevToolsErrorType>) {
  //   this.#errorTypes = value
  //   this.#devtools?.setErrorTypes(value)
  // }
  // get errorTypes(): Array<DevToolsErrorType> {
  //   return this.#errorTypes
  // }

  ngAfterViewInit() {
    const client = this.#getAppliedQueryClient()

    const { buttonPosition, position, initialIsOpen } = this
    this.#devtools = new TanstackQueryDevtools({
      client,
      queryFlavor: 'Angular Query',
      version: '5',
      onlineManager,
      buttonPosition,
      position,
      initialIsOpen,
      // errorTypes,
    })
    this.#devtools.mount(this.ref.nativeElement)
  }

  ngOnDestroy() {
    this.#devtools?.unmount()
  }

  #getAppliedQueryClient() {
    if (!this.#clientFromAttribute && !this.#injectedClient) {
      throw new Error(
        `You must either provide a client via 'provideAngularQuery' or pass it to the 'client' attribute of angular-query-devtools.`,
      )
    }
    return this.#clientFromAttribute ?? this.#injectedClient!
  }
}
