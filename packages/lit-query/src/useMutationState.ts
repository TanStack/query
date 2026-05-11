import type {
  Mutation,
  MutationFilters,
  MutationState,
  QueryClient,
} from '@tanstack/query-core'
import type { ReactiveControllerHost } from 'lit'
import {
  createValueAccessor,
  readAccessor,
  type Accessor,
  type ValueAccessor,
} from './accessor.js'
import { BaseController } from './controllers/BaseController.js'

/**
 * Options accepted by `useMutationState`.
 */
export type MutationStateOptions<TResult> = {
  /** Filters used to select mutations from the mutation cache. */
  filters?: Accessor<MutationFilters>
  /** Maps each matching mutation to the value returned by the accessor. */
  select?: (mutation: Mutation) => TResult
}

/**
 * Accessor returned by `useMutationState`.
 *
 * Call the accessor or read its `current` property to get the selected state for
 * matching mutations.
 */
export type MutationStateAccessor<TResult> = ValueAccessor<TResult[]> & {
  /** Removes the controller from its Lit host and unsubscribes observers. */
  destroy: () => void
}

class MutationStateController<TResult> extends BaseController<TResult[]> {
  private queryClient: QueryClient | undefined
  private unsubscribe: (() => void) | undefined

  constructor(
    host: ReactiveControllerHost,
    private readonly options: MutationStateOptions<TResult>,
    queryClient?: QueryClient,
  ) {
    super(host, [], queryClient)

    if (!queryClient) {
      return
    }

    this.queryClient = queryClient
    this.result = this.computeState()
  }

  protected onConnected(): void {
    if (!this.syncClient()) {
      this.setResult([])
      return
    }

    this.subscribe()
    this.setResult(this.computeState())
  }

  protected onDisconnected(): void {
    this.unsubscribe?.()
    this.unsubscribe = undefined
    this.syncClient()
  }

  protected onHostUpdate(): void {
    if (!this.shouldRefreshOnHostUpdate()) {
      return
    }

    this.setResult(this.syncClient() ? this.computeState() : [])
  }

  protected onQueryClientChanged(): void {
    if (!this.syncClient()) {
      this.setResult([])
      return
    }

    if (this.connectedState) {
      this.subscribe()
      this.setResult(this.computeState())
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
      this.setResult(this.computeState())
    })
  }

  private shouldRefreshOnHostUpdate(): boolean {
    return (
      typeof this.options.filters === 'function' ||
      typeof this.options.select === 'function'
    )
  }

  private computeState(): TResult[] {
    if (!this.queryClient) {
      return []
    }

    const filters = this.options.filters
      ? readAccessor(this.options.filters)
      : undefined

    const select = this.options.select
    const mutations = this.queryClient.getMutationCache().findAll(filters)

    return mutations.map((mutation) => {
      if (select) {
        return select(mutation)
      }

      return mutation.state as TResult
    })
  }
}

/**
 * Creates a Lit reactive controller that selects state from matching mutations
 * in the mutation cache.
 *
 * When `options.filters` is a function, it is re-read during host updates so
 * the selection can follow reactive host state. If `queryClient` is omitted,
 * the controller resolves the client from the nearest connected
 * `QueryClientProvider`.
 *
 * @param host - The Lit reactive controller host that owns the mutation cache
 * subscription.
 * @param options - Mutation state filters and optional selector.
 * @param queryClient - Optional explicit query client. Provide this for
 * controllers that should not resolve a client from Lit context.
 * @returns An accessor for the selected mutation state array.
 *
 * @example
 * ```ts
 * import { LitElement, html } from 'lit'
 * import { useMutationState } from '@tanstack/lit-query'
 *
 * class PendingUploads extends LitElement {
 *   private readonly uploads = useMutationState(this, {
 *     filters: { mutationKey: ['upload'], status: 'pending' },
 *     select: (mutation) => mutation.state.variables as File,
 *   })
 *
 *   render() {
 *     return html`<span>${this.uploads().length} uploads pending</span>`
 *   }
 * }
 * ```
 */
export function useMutationState<
  TResult = MutationState<unknown, unknown, unknown, unknown>,
>(
  host: ReactiveControllerHost,
  options: MutationStateOptions<TResult> = {},
  queryClient?: QueryClient,
): MutationStateAccessor<TResult> {
  const controller = new MutationStateController(host, options, queryClient)
  return Object.assign(
    createValueAccessor(() => controller.current),
    {
      destroy: () => controller.destroy(),
    },
  )
}
