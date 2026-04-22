import { ContextEvent } from '@lit/context'
import type { QueryClient } from '@tanstack/query-core'
import type { ReactiveController, ReactiveControllerHost } from 'lit'
import {
  createMissingQueryClientError,
  queryClientContext,
} from '../context.js'

type QueryClientResolutionState =
  | 'pre-connect'
  | 'awaiting-context'
  | 'bound'
  | 'missing'

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

  hostUpdate(): void {
    if (this.destroyed) {
      return
    }

    this.onHostUpdate()
  }

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

  protected tryGetQueryClient(): QueryClient | undefined {
    return this.explicitClient ?? this.contextClient
  }

  protected getQueryClient(): QueryClient {
    const client = this.tryGetQueryClient()
    if (!client) {
      throw createMissingQueryClientError()
    }

    return client
  }

  protected setResult(next: TResult): void {
    if (Object.is(this.result, next)) {
      return
    }

    this.result = next
    this.queueUpdate()
  }

  get current(): TResult {
    if (this.queryClientResolutionState === 'missing') {
      throw createMissingQueryClientError()
    }

    return this.result
  }

  protected get connectedState(): boolean {
    return this.connected
  }

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

          const resolutionChanged =
            this.updateQueryClientResolutionState('bound')
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

  protected abstract onConnected(): void
  protected abstract onDisconnected(): void
  protected abstract onHostUpdate(): void
  protected abstract onQueryClientChanged(): void
}
