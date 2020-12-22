import type { MutationOptions, MutationStatus } from './types'
import type { MutationCache } from './mutationCache'
import type { MutationObserver } from './mutationObserver'
import { getLogger } from './logger'
import { notifyManager } from './notifyManager'
import { Retryer } from './retryer'
import { noop } from './utils'

// TYPES

interface MutationConfig<TData, TError, TVariables, TContext> {
  mutationId: number
  mutationCache: MutationCache
  options: MutationOptions<TData, TError, TVariables, TContext>
  defaultOptions?: MutationOptions<TData, TError, TVariables, TContext>
  state?: MutationState<TData, TError, TVariables, TContext>
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
> {
  state: MutationState<TData, TError, TVariables, TContext>
  options: MutationOptions<TData, TError, TVariables, TContext>
  mutationId: number

  private observers: MutationObserver<TData, TError, TVariables, TContext>[]
  private mutationCache: MutationCache
  private retryer?: Retryer<TData, TError>

  constructor(config: MutationConfig<TData, TError, TVariables, TContext>) {
    this.options = {
      ...config.defaultOptions,
      ...config.options,
    }
    this.mutationId = config.mutationId
    this.mutationCache = config.mutationCache
    this.observers = []
    this.state = config.state || getDefaultState()
  }

  setState(state: MutationState<TData, TError, TVariables, TContext>): void {
    this.dispatch({ type: 'setState', state })
  }

  addObserver(observer: MutationObserver<any, any, any, any>): void {
    if (this.observers.indexOf(observer) === -1) {
      this.observers.push(observer)
    }
  }

  removeObserver(observer: MutationObserver<any, any, any, any>): void {
    this.observers = this.observers.filter(x => x !== observer)
  }

  cancel(): Promise<void> {
    if (this.retryer) {
      this.retryer.cancel()
      return this.retryer.promise.then(noop).catch(noop)
    }
    return Promise.resolve()
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
        if (this.mutationCache.config.onError) {
          this.mutationCache.config.onError(
            error,
            this.state.variables,
            this.state.context,
            this as Mutation<unknown, unknown, unknown, unknown>
          )
        }

        // Log error
        getLogger().error(error)

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
    this.retryer = new Retryer({
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
    })

    return this.retryer.promise
  }

  private dispatch(action: Action<TData, TError, TVariables, TContext>): void {
    this.state = reducer(this.state, action)

    notifyManager.batch(() => {
      this.observers.forEach(observer => {
        observer.onMutationUpdate(action)
      })
      this.mutationCache.notify(this)
    })
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

function reducer<TData, TError, TVariables, TContext>(
  state: MutationState<TData, TError, TVariables, TContext>,
  action: Action<TData, TError, TVariables, TContext>
): MutationState<TData, TError, TVariables, TContext> {
  switch (action.type) {
    case 'failed':
      return {
        ...state,
        failureCount: state.failureCount + 1,
      }
    case 'pause':
      return {
        ...state,
        isPaused: true,
      }
    case 'continue':
      return {
        ...state,
        isPaused: false,
      }
    case 'loading':
      return {
        ...state,
        context: action.context,
        data: undefined,
        error: null,
        isPaused: false,
        status: 'loading',
        variables: action.variables,
      }
    case 'success':
      return {
        ...state,
        data: action.data,
        error: null,
        status: 'success',
        isPaused: false,
      }
    case 'error':
      return {
        ...state,
        data: undefined,
        error: action.error,
        failureCount: state.failureCount + 1,
        isPaused: false,
        status: 'error',
      }
    case 'setState':
      return {
        ...state,
        ...action.state,
      }
    default:
      return state
  }
}
