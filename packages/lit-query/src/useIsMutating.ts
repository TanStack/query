import type { MutationFilters, QueryClient } from '@tanstack/query-core'
import type { ReactiveControllerHost } from 'lit'
import {
  createValueAccessor,
  readAccessor,
  type Accessor,
  type ValueAccessor,
} from './accessor.js'
import { BaseController } from './controllers/BaseController.js'

/**
 * Accessor returned by `useIsMutating`.
 *
 * Call the accessor or read its `current` property to get the number of
 * currently pending mutations that match the filters.
 */
export type IsMutatingAccessor = ValueAccessor<number> & { destroy: () => void }

class IsMutatingController extends BaseController<number> {
  private queryClient: QueryClient | undefined
  private unsubscribe: (() => void) | undefined

  constructor(
    host: ReactiveControllerHost,
    private readonly filters: Accessor<MutationFilters> = {},
    queryClient?: QueryClient,
  ) {
    super(host, 0, queryClient)

    if (!queryClient) {
      return
    }

    this.queryClient = queryClient
    this.result = this.computeValue()
  }

  protected onConnected(): void {
    if (!this.syncClient()) {
      this.setResult(0)
      return
    }

    this.subscribe()
    this.setResult(this.computeValue())
  }

  protected onDisconnected(): void {
    this.unsubscribe?.()
    this.unsubscribe = undefined
    this.syncClient()
  }

  protected onHostUpdate(): void {
    if (typeof this.filters !== 'function') {
      return
    }

    this.setResult(this.syncClient() ? this.computeValue() : 0)
  }

  protected onQueryClientChanged(): void {
    if (!this.syncClient()) {
      this.setResult(0)
      return
    }

    if (this.connectedState) {
      this.subscribe()
      this.setResult(this.computeValue())
    }
  }

  private syncClient(): boolean {
    const nextClient = this.tryGetQueryClient()
    if (!nextClient) {
      this.unsubscribe?.()
      this.unsubscribe = undefined
      this.queryClient = undefined
      return false
    }

    if (nextClient === this.queryClient) {
      return true
    }

    this.unsubscribe?.()
    this.unsubscribe = undefined
    this.queryClient = nextClient
    return true
  }

  private subscribe(): void {
    if (!this.queryClient) {
      return
    }

    if (this.unsubscribe) {
      return
    }

    this.unsubscribe = this.queryClient.getMutationCache().subscribe(() => {
      this.setResult(this.computeValue())
    })
  }

  private computeValue(): number {
    if (!this.queryClient) {
      return 0
    }

    return this.queryClient.isMutating(readAccessor(this.filters))
  }
}

/**
 * Creates a Lit reactive controller that tracks how many matching mutations are
 * currently pending.
 *
 * When `filters` is a function, it is re-read during host updates so the count
 * can follow reactive host state. If `queryClient` is omitted, the controller
 * resolves the client from the nearest connected `QueryClientProvider`.
 *
 * @param host - The Lit reactive controller host that owns the cache
 * subscription.
 * @param filters - Mutation filters, or a getter that returns mutation filters.
 * @param queryClient - Optional explicit query client. Provide this for
 * controllers that should not resolve a client from Lit context.
 * @returns An accessor for the current number of matching pending mutations.
 *
 * @example
 * ```ts
 * import { LitElement, html } from 'lit'
 * import { useIsMutating } from '@tanstack/lit-query'
 *
 * class MutationStatus extends LitElement {
 *   private readonly savesPending = useIsMutating(this, {
 *     mutationKey: ['save-project'],
 *   })
 *
 *   render() {
 *     return html`<span>${this.savesPending()} saves pending</span>`
 *   }
 * }
 * ```
 */
export function useIsMutating(
  host: ReactiveControllerHost,
  filters: Accessor<MutationFilters> = {},
  queryClient?: QueryClient,
): IsMutatingAccessor {
  const controller = new IsMutatingController(host, filters, queryClient)
  return Object.assign(
    createValueAccessor(() => controller.current),
    {
      destroy: () => controller.destroy(),
    },
  )
}
