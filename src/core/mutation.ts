import type { MutationOptions, MutationStatus, MutationMeta } from './types'
import type { MutationCache } from './mutationCache'
import type { MutationObserver } from './mutationObserver'
import { getLogger } from './logger'
import { notifyManager } from './notifyManager'
import { Removable } from './removable'
import { canFetch, Retryer, createRetryer } from './retryer'

// TYPES

interface MutationConfig<TData, TError, TVariables, TContext> {
  mutationId: number
  mutationCache: MutationCache
  options: MutationOptions<TData, TError, TVariables, TContext>
  defaultOptions?: MutationOptions<TData, TError, TVariables, TContext>
  state?: MutationState<TData, TError, TVariables, TContext>
  meta?: MutationMeta
}

export interface MutationState<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
> {
  context: TContext | undefined
  data: TData | undefined
  error: TError | null
  failureCount: number
  isPaused: boolean
  status: MutationStatus
  variables: TVariables | undefined
}

interface FailedAction {
  type: 'failed'
}

interface LoadingAction<TVariables, TContext> {
  type: 'loading'
  variables?: TVariables
  context?: TContext
}

interface SuccessAction<TData> {
  type: 'success'
  data: TData
}

interface ErrorAction<TError> {
  type: 'error'
  error: TError
}

interface PauseAction {
  type: 'pause'
}

interface ContinueAction {
  type: 'continue'
}

interface SetStateAction<TData, TError, TVariables, TContext> {
  type: 'setState'
  state: MutationState<TData, TError, TVariables, TContext>
}

export type Action<TData, TError, TVariables, TContext> =
  | ContinueAction
  | ErrorAction<TError>
  | FailedAction
  | LoadingAction<TVariables, TContext>
  | PauseAction
  | SetStateAction<TData, TError, TVariables, TContext>
  | SuccessAction<TData>

// CLASS

export class Mutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
> extends Removable {
  state: MutationState<TData, TError, TVariables, TContext>
  options: MutationOptions<TData, TError, TVariables, TContext>
  mutationId: number
  meta: MutationMeta | undefined

  private observers: MutationObserver<TData, TError, TVariables, TContext>[]
  private mutationCache: MutationCache
  private retryer?: Retryer<TData>

  constructor(config: MutationConfig<TData, TError, TVariables, TContext>) {
    super()

    this.options = {
      ...config.defaultOptions,
      ...config.options,
    }
    this.mutationId = config.mutationId
    this.mutationCache = config.mutationCache
    this.observers = []
    this.state = config.state || getDefaultState()
    this.meta = config.meta

    this.updateCacheTime(this.options.cacheTime)
    this.scheduleGc()
  }

  setState(state: MutationState<TData, TError, TVariables, TContext>): void {
    this.dispatch({ type: 'setState', state })
  }

  addObserver(observer: MutationObserver<any, any, any, any>): void {
    if (this.observers.indexOf(observer) === -1) {
      this.observers.push(observer)

      // Stop the mutation from being garbage collected
      this.clearGcTimeout()

      this.mutationCache.notify({
        type: 'observerAdded',
        mutation: this,
        observer,
      })
    }
  }

  removeObserver(observer: MutationObserver<any, any, any, any>): void {
    this.observers = this.observers.filter(x => x !== observer)

    this.scheduleGc()

    this.mutationCache.notify({
      type: 'observerRemoved',
      mutation: this,
      observer,
    })
  }

  protected optionalRemove() {
    if (!this.observers.length) {
      if (this.state.status === 'loading') {
        this.scheduleGc()
      } else {
        this.mutationCache.remove(this)
      }
    }
  }

  continue(): Promise<TData> {
    if (this.retryer) {
      this.retryer.continue()
      return this.retryer.promise
    }
    return this.execute()
  }

  execute(): Promise<TData> {
    let data: TData

    const restored = this.state.status === 'loading'

    let promise = Promise.resolve()

    if (!restored) {
      this.dispatch({ type: 'loading', variables: this.options.variables! })
      promise = promise
        .then(() => {
          // Notify cache callback
          this.mutationCache.config.onMutate?.(
            this.state.variables,
            this as Mutation<unknown, unknown, unknown, unknown>
          )
        })
        .then(() => this.options.onMutate?.(this.state.variables!))
        .then(context => {
          if (context !== this.state.context) {
            this.dispatch({
              type: 'loading',
              context,
              variables: this.state.variables,
            })
          }
        })
    }

    return promise
      .then(() => this.executeMutation())
      .then(result => {
        data = result
        // Notify cache callback
        this.mutationCache.config.onSuccess?.(
          data,
          this.state.variables,
          this.state.context,
          this as Mutation<unknown, unknown, unknown, unknown>
        )
      })
      .then(() =>
        this.options.onSuccess?.(
          data,
          this.state.variables!,
          this.state.context!
        )
      )
      .then(() =>
        this.options.onSettled?.(
          data,
          null,
          this.state.variables!,
          this.state.context
        )
      )
      .then(() => {
        this.dispatch({ type: 'success', data })
        return data
      })
      .catch(error => {
        // Notify cache callback
        this.mutationCache.config.onError?.(
          error,
          this.state.variables,
          this.state.context,
          this as Mutation<unknown, unknown, unknown, unknown>
        )

        if (process.env.NODE_ENV !== 'production') {
          getLogger().error(error)
        }

        return Promise.resolve()
          .then(() =>
            this.options.onError?.(
              error,
              this.state.variables!,
              this.state.context
            )
          )
          .then(() =>
            this.options.onSettled?.(
              undefined,
              error,
              this.state.variables!,
              this.state.context
            )
          )
          .then(() => {
            this.dispatch({ type: 'error', error })
            throw error
          })
      })
  }

  private executeMutation(): Promise<TData> {
    this.retryer = createRetryer({
      fn: () => {
        if (!this.options.mutationFn) {
          return Promise.reject('No mutationFn found')
        }
        return this.options.mutationFn(this.state.variables!)
      },
      onFail: () => {
        this.dispatch({ type: 'failed' })
      },
      onPause: () => {
        this.dispatch({ type: 'pause' })
      },
      onContinue: () => {
        this.dispatch({ type: 'continue' })
      },
      retry: this.options.retry ?? 0,
      retryDelay: this.options.retryDelay,
      networkMode: this.options.networkMode,
    })

    return this.retryer.promise
  }

  private dispatch(action: Action<TData, TError, TVariables, TContext>): void {
    this.state = this.reducer(action)

    notifyManager.batch(() => {
      this.observers.forEach(observer => {
        observer.onMutationUpdate(action)
      })
      this.mutationCache.notify({
        mutation: this,
        type: 'updated',
        action,
      })
    })
  }

  private reducer(
    action: Action<TData, TError, TVariables, TContext>
  ): MutationState<TData, TError, TVariables, TContext> {
    switch (action.type) {
      case 'failed':
        return {
          ...this.state,
          failureCount: this.state.failureCount + 1,
        }
      case 'pause':
        return {
          ...this.state,
          isPaused: true,
        }
      case 'continue':
        return {
          ...this.state,
          isPaused: false,
        }
      case 'loading':
        return {
          ...this.state,
          context: action.context,
          data: undefined,
          error: null,
          isPaused: !canFetch(this.options.networkMode),
          status: 'loading',
          variables: action.variables,
        }
      case 'success':
        return {
          ...this.state,
          data: action.data,
          error: null,
          status: 'success',
          isPaused: false,
        }
      case 'error':
        return {
          ...this.state,
          data: undefined,
          error: action.error,
          failureCount: this.state.failureCount + 1,
          isPaused: false,
          status: 'error',
        }
      case 'setState':
        return {
          ...this.state,
          ...action.state,
        }
      default:
        return this.state
    }
  }
}

export function getDefaultState<
  TData,
  TError,
  TVariables,
  TContext
>(): MutationState<TData, TError, TVariables, TContext> {
  return {
    context: undefined,
    data: undefined,
    error: null,
    failureCount: 0,
    isPaused: false,
    status: 'idle',
    variables: undefined,
  }
}
