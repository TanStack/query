import { uid, isServer, isDocumentVisible, Console } from './utils'
import { Query, QueryState, Action, ActionType } from './query'
import { BaseQueryConfig } from './types'

// TYPES

export type OnStateUpdateFunction<TResult, TError> = (
  state: QueryState<TResult, TError>
) => void

// CLASS

export class QueryInstance<TResult, TError> {
  id: number
  config: BaseQueryConfig<TResult, TError>

  private query: Query<TResult, TError>
  private refetchIntervalId?: number
  private stateUpdateListener?: OnStateUpdateFunction<TResult, TError>

  constructor(
    query: Query<TResult, TError>,
    onStateUpdate?: OnStateUpdateFunction<TResult, TError>
  ) {
    this.id = uid()
    this.stateUpdateListener = onStateUpdate
    this.query = query
    this.config = {}
  }

  clearInterval(): void {
    if (this.refetchIntervalId) {
      clearInterval(this.refetchIntervalId)
      this.refetchIntervalId = undefined
    }
  }

  updateConfig(config: BaseQueryConfig<TResult, TError>): void {
    const oldConfig = this.config

    // Update the config
    this.config = config

    if (!isServer) {
      if (oldConfig?.refetchInterval === config.refetchInterval) {
        return
      }

      this.query.clearIntervals()

      const minInterval = Math.min(
        ...this.query.instances.map(d => d.config.refetchInterval || Infinity)
      )

      if (
        !this.refetchIntervalId &&
        minInterval > 0 &&
        minInterval < Infinity
      ) {
        this.refetchIntervalId = setInterval(() => {
          if (
            this.query.instances.some(d => d.config.enabled) &&
            (isDocumentVisible() ||
              this.query.instances.some(
                d => d.config.refetchIntervalInBackground
              ))
          ) {
            this.query.fetch()
          }
        }, minInterval)
      }
    }
  }

  async run(): Promise<void> {
    try {
      // Perform the refetch for this query if necessary
      if (
        this.query.instances.some(d => d.config.enabled) && // Don't auto refetch if disabled
        !(this.config.suspense && this.query.state.isFetched) && // Don't refetch if in suspense mode and the data is already fetched
        this.query.state.isStale && // Only refetch if stale
        (this.config.refetchOnMount || this.query.instances.length === 1)
      ) {
        await this.query.fetch()
      }
    } catch (error) {
      Console.error(error)
    }
  }

  unsubscribe(preventGC?: boolean): void {
    this.query.instances = this.query.instances.filter(d => d.id !== this.id)

    if (!this.query.instances.length) {
      this.clearInterval()
      this.query.cancel()

      if (!preventGC && !isServer) {
        // Schedule garbage collection
        this.query.scheduleGarbageCollection()
      }
    }
  }

  onStateUpdate(
    state: QueryState<TResult, TError>,
    action: Action<TResult, TError>
  ): void {
    if (action.type === ActionType.Success && state.isSuccess) {
      this.config.onSuccess?.(state.data!)
      this.config.onSettled?.(state.data!, null)
    }

    if (action.type === ActionType.Error && state.isError) {
      this.config.onError?.(state.error!)
      this.config.onSettled?.(undefined, state.error!)
    }

    this.stateUpdateListener?.(state)
  }
}
