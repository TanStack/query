import { ContextEvent } from '@lit/context'
import {
  createMissingQueryClientError,
  queryClientContext,
} from '../context.js'
import type { QueryClient } from '@tanstack/query-core'
import type { ReactiveController, ReactiveControllerHost } from 'lit'

type QueryClientResolutionState =
  'pre-connect' | 'awaiting-context' | 'bound' | 'missing'

/**
 * Base class of the query controllers. It resolves the `QueryClient`, either
 * passed explicitly or provided through context by a `QueryClientProvider`,
 * follows the host's lifecycle, and requests a host update when the result
 * changes.
 */
export abstract class BaseController<TResult> implements ReactiveController {
  protected result: TResult

  private readonly explicitClient?: QueryClient
  private contextClient: QueryClient | undefined
  private contextUnsubscribe: (() => void) | undefined

  private connected = false
  private destroyed = false
  private updateQueued = false
  private clientChangeQueued = false
  private connectionAttempt = 0
  private isHostUpdating = false
  private queryClientResolutionState: QueryClientResolutionState

  protected constructor(
    protected readonly host: ReactiveControllerHost,
    initialResult: TResult,
    queryClient?: QueryClient,
  ) {
    this.explicitClient = queryClient
    this.result = initialResult
    this.queryClientResolutionState = queryClient ? 'bound' : 'pre-connect'

    host.addController(this)
  }

  /**
   * Starts resolving the `QueryClient` from context, unless one was passed
   * explicitly, and calls `onConnected` in a microtask so subclass fields are
   * initialized first.
   */
  hostConnected(): void {
    if (this.connected || this.destroyed) {
      return
    }

    this.connected = true
    let contextResolutionAttempt: number | undefined

    if (this.explicitClient) {
      this.queryClientResolutionState = 'bound'
    } else {
      contextResolutionAttempt = ++this.connectionAttempt
      this.beginContextResolution()
    }

    // Defer onConnected to ensure subclass constructors complete before
    // lifecycle callbacks access subclass state. This handles the case where
    // addController is called on an already-connected host (e.g., during
    // willUpdate), which synchronously triggers hostConnected before
    // subclass field initialization.
    queueMicrotask(() => {
      if (this.connected && !this.destroyed) {
        this.onConnected()
      }
    })

    if (contextResolutionAttempt !== undefined) {
      // Provider-backed controllers on already-connected hosts should finish
      // their deferred onConnected pass before a context client binds.
      this.queueContextResolution(contextResolutionAttempt)
    }
  }

  /**
   * Releases the context `QueryClient`, unless one was passed explicitly, and
   * calls `onDisconnected`.
   */
  hostDisconnected(): void {
    if (!this.connected) {
      return
    }

    this.connected = false

    if (!this.explicitClient) {
      this.connectionAttempt += 1
      this.clearContextClient()
      this.updateQueryClientResolutionState('pre-connect')
    }

    this.onDisconnected()
  }

  /**
   * Calls `onHostUpdate` before the host renders. Results set during this call
   * don't request another update.
   */
  hostUpdate(): void {
    if (this.destroyed) {
      return
    }

    this.isHostUpdating = true
    try {
      this.onHostUpdate()
    } finally {
      this.isHostUpdating = false
    }
  }

  /**
   * Permanently disconnects the controller and removes it from its host, if
   * the host supports `removeController`. The controller ignores later
   * lifecycle callbacks.
   */
  destroy(): void {
    if (this.destroyed) {
      return
    }

    this.destroyed = true
    this.connected = false
    this.connectionAttempt += 1
    this.clearContextClient()
    this.queryClientResolutionState = this.explicitClient
      ? 'bound'
      : 'pre-connect'
    this.onDisconnected()

    if ('removeController' in this.host) {
      this.host.removeController(this)
    }
  }

  /**
   * Returns the `QueryClient` without throwing when none is available.
   * @returns The explicitly passed client, otherwise the client from context,
   * or `undefined` if neither is available.
   */
  protected tryGetQueryClient(): QueryClient | undefined {
    return this.explicitClient ?? this.contextClient
  }

  /**
   * Returns the `QueryClient`, throwing when none is available.
   * @returns The explicitly passed client, otherwise the client from context.
   * @throws {Error} If no `QueryClient` is available.
   */
  protected getQueryClient(): QueryClient {
    const client = this.tryGetQueryClient()
    if (!client) {
      throw createMissingQueryClientError()
    }

    return client
  }

  /**
   * Stores a new result and requests a host update, unless it is the same
   * result or the host is already updating.
   * @param next - The new result.
   */
  protected setResult(next: TResult): void {
    if (Object.is(this.result, next)) {
      return
    }

    this.result = next
    if (!this.isHostUpdating) {
      this.queueUpdate()
    }
  }

  /**
   * The latest result of the controller.
   * @returns The latest result.
   * @throws {Error} If no `QueryClient` could be resolved from context.
   */
  get current(): TResult {
    if (this.queryClientResolutionState === 'missing') {
      throw createMissingQueryClientError()
    }

    return this.result
  }

  /**
   * Whether the controller's host is connected.
   * @returns `true` while the host is connected.
   */
  protected get connectedState(): boolean {
    return this.connected
  }

  /**
   * Requests a host update in a microtask, batching multiple calls into one.
   */
  protected queueUpdate(): void {
    if (this.updateQueued) {
      return
    }

    this.updateQueued = true
    queueMicrotask(() => {
      this.updateQueued = false
      if (!this.destroyed) {
        this.host.requestUpdate()
      }
    })
  }

  private queueQueryClientChanged(): void {
    if (this.clientChangeQueued) {
      return
    }

    this.clientChangeQueued = true
    queueMicrotask(() => {
      this.clientChangeQueued = false
      if (!this.destroyed) {
        this.onQueryClientChanged()
      }
    })
  }

  private beginContextResolution(): void {
    this.clearContextClient()
    this.updateQueryClientResolutionState('awaiting-context')
  }

  private queueContextResolution(attempt: number): void {
    queueMicrotask(() => {
      if (
        this.destroyed ||
        !this.connected ||
        attempt !== this.connectionAttempt ||
        this.queryClientResolutionState !== 'awaiting-context'
      ) {
        return
      }

      this.dispatchContextRequest(attempt)
      this.queueInitialContextResolutionCompletion(attempt)
    })
  }

  private dispatchContextRequest(attempt: number): void {
    if (!('dispatchEvent' in this.host)) {
      return
    }

    const contextTarget = this.host as ReactiveControllerHost & EventTarget
    contextTarget.dispatchEvent(
      new ContextEvent(
        queryClientContext,
        contextTarget as unknown as Element,
        (value, unsubscribe) => {
          if (
            this.destroyed ||
            !this.connected ||
            attempt !== this.connectionAttempt
          ) {
            unsubscribe?.()
            return
          }

          if (
            this.contextUnsubscribe &&
            this.contextUnsubscribe !== unsubscribe
          ) {
            this.contextUnsubscribe()
          }

          const resolutionChanged = this.updateQueryClientResolutionState(
            // oxlint-disable-next-line typescript/no-unnecessary-condition
            value === undefined ? 'missing' : 'bound',
          )
          const clientChanged = this.contextClient !== value

          this.contextClient = value
          this.contextUnsubscribe = unsubscribe

          if (resolutionChanged || clientChanged) {
            this.queueUpdate()
            this.queueQueryClientChanged()
          }
        },
        true,
      ),
    )
  }

  private queueInitialContextResolutionCompletion(attempt: number): void {
    queueMicrotask(() => {
      if (
        this.destroyed ||
        !this.connected ||
        attempt !== this.connectionAttempt ||
        this.queryClientResolutionState !== 'awaiting-context'
      ) {
        return
      }

      if (this.updateQueryClientResolutionState('missing')) {
        this.queueUpdate()
        this.queueQueryClientChanged()
      }
    })
  }

  private clearContextClient(): void {
    this.contextUnsubscribe?.()
    this.contextUnsubscribe = undefined
    this.contextClient = undefined
  }

  private updateQueryClientResolutionState(
    nextState: QueryClientResolutionState,
  ): boolean {
    if (this.queryClientResolutionState === nextState) {
      return false
    }

    this.queryClientResolutionState = nextState
    return true
  }

  /**
   * Called in a microtask after the host connects, once the subclass fields
   * are initialized. Subclasses subscribe to the `QueryClient` here, if one is
   * available.
   */
  protected abstract onConnected(): void
  /**
   * Called when the host disconnects or the controller is destroyed.
   * Subclasses unsubscribe here.
   */
  protected abstract onDisconnected(): void
  /**
   * Called before each host update. Subclasses refresh their options here.
   */
  protected abstract onHostUpdate(): void
  /**
   * Called in a microtask when the `QueryClient` from context changes, or when
   * resolving it finishes without finding one (`tryGetQueryClient` then returns
   * `undefined`). Subclasses resubscribe to the new client here, if there is
   * one.
   */
  protected abstract onQueryClientChanged(): void
}
