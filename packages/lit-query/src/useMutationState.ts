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

export type MutationStateOptions<TResult> = {
  filters?: Accessor<MutationFilters>
  select?: (mutation: Mutation) => TResult
}

export type MutationStateAccessor<TResult> = ValueAccessor<TResult[]> & {
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
