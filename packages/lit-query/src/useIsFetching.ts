import type { QueryClient, QueryFilters } from '@tanstack/query-core'
import type { ReactiveControllerHost } from 'lit'
import {
  createValueAccessor,
  readAccessor,
  type Accessor,
  type ValueAccessor,
} from './accessor.js'
import { BaseController } from './controllers/BaseController.js'

export type IsFetchingAccessor = ValueAccessor<number> & { destroy: () => void }

class IsFetchingController extends BaseController<number> {
  private queryClient: QueryClient | undefined
  private unsubscribe: (() => void) | undefined

  constructor(
    host: ReactiveControllerHost,
    private readonly filters: Accessor<QueryFilters> = {},
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

    this.unsubscribe = this.queryClient.getQueryCache().subscribe(() => {
      this.setResult(this.computeValue())
    })
  }

  private computeValue(): number {
    if (!this.queryClient) {
      return 0
    }

    return this.queryClient.isFetching(readAccessor(this.filters))
  }
}

export function useIsFetching(
  host: ReactiveControllerHost,
  filters: Accessor<QueryFilters> = {},
  queryClient?: QueryClient,
): IsFetchingAccessor {
  const controller = new IsFetchingController(host, filters, queryClient)
  return Object.assign(
    createValueAccessor(() => controller.current),
    {
      destroy: () => controller.destroy(),
    },
  )
}
