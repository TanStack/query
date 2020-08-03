import { uid, isServer, isDocumentVisible, Console } from './utils'
import { Query, QueryState } from './query'
import { BaseQueryConfig } from './types'

// TYPES

export type OnStateUpdateFunction<TResult, TError> = (
  state: QueryState<TResult, TError>
) => void

// CLASS

export class QueryInstance<TResult, TError> {
  id: number
  config: BaseQueryConfig<TResult, TError>
  onStateUpdate?: OnStateUpdateFunction<TResult, TError>

  private query: Query<TResult, TError>
  private refetchIntervalId?: number

  constructor(
    query: Query<TResult, TError>,
    onStateUpdate?: OnStateUpdateFunction<TResult, TError>
  ) {
    this.id = uid()
    this.onStateUpdate = onStateUpdate
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
        !this.query.wasSuspended && // Don't double refetch for suspense
        this.query.state.isStale && // Only refetch if stale
        (this.query.config.refetchOnMount || this.query.instances.length === 1)
      ) {
        await this.query.fetch()
      }

      this.query.wasSuspended = false
    } catch (error) {
      Console.error(error)
    }
  }

  unsubscribe(): void {
    this.query.instances = this.query.instances.filter(d => d.id !== this.id)

    if (!this.query.instances.length) {
      this.clearInterval()
      this.query.cancel()

      if (!isServer) {
        // Schedule garbage collection
        this.query.scheduleGarbageCollection()
      }
    }
  }
}
