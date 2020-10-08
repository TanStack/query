import { getLogger } from './logger'
import { OnMutateContext, composeOnMutate } from './plugins'
import { notifyManager } from './notifyManager'
import { getStatusProps } from './utils'
import type { MutateOptions, MutationOptions, MutationStatus } from './types'
import type { MutationObserver } from './mutationObserver'
import type { QueryClient } from './queryClient'

// TYPES

interface MutationConfig<TData, TError, TVariables, TContext> {
  options: MutationOptions<TData, TError, TVariables, TContext>
}

export interface MutationState<TData, TError, TVariables> {
  data: TData | undefined
  error: TError | null
  isError: boolean
  isIdle: boolean
  isLoading: boolean
  isSuccess: boolean
  status: MutationStatus
  variables: TVariables | undefined
}

interface ResetAction {
  type: 'reset'
}

interface LoadingAction<TVariables> {
  type: 'loading'
  variables: TVariables
}

interface SuccessAction<TData> {
  type: 'success'
  data: TData
}

interface ErrorAction<TError> {
  type: 'error'
  error: TError
}

type Action<TData, TError, TVariables> =
  | ErrorAction<TError>
  | LoadingAction<TVariables>
  | ResetAction
  | SuccessAction<TData>

// CLASS

export class Mutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
> {
  state: MutationState<TData, TError, TVariables>
  options!: MutationOptions<TData, TError, TVariables, TContext>

  private observers: MutationObserver<TData, TError, TVariables, TContext>[]
  private mutationId: number

  constructor(config: MutationConfig<TData, TError, TVariables, TContext>) {
    this.options = config.options
    this.observers = []
    this.state = getDefaultState()
    this.mutationId = 0
  }

  setOptions(
    options?: MutationOptions<TData, TError, TVariables, TContext>
  ): void {
    this.options = options || {}
  }

  private dispatch(action: Action<TData, TError, TVariables>): void {
    this.state = reducer(this.state, action)
    notifyManager.batch(() => {
      this.observers.forEach(observer => {
        observer.onMutationUpdate()
      })
    })
  }

  subscribeObserver(observer: MutationObserver<any, any, any, any>): void {
    if (this.observers.indexOf(observer) === -1) {
      this.observers.push(observer)
    }
  }

  unsubscribeObserver(observer: MutationObserver<any, any, any, any>): void {
    this.observers = this.observers.filter(x => x !== observer)
  }

  reset(): void {
    this.dispatch({ type: 'reset' })
  }

  mutate(
    client: QueryClient,
    variables: TVariables,
    options: MutateOptions<TData, TError, TVariables, TContext> = {}
  ): Promise<TData> {
    const mutationId = ++this.mutationId

    let context: TContext | undefined
    let data: TData

    this.dispatch({ type: 'loading', variables })

    return Promise.resolve()
      .then(() => this.options.onMutate?.(variables))
      .then(result => {
        context = result
      })
      .then(() => {
        const onMutateContext: OnMutateContext = {
          client,
          mutation: this,
          options: this.options,
          variables,
        }

        const fn = composeOnMutate<TData>(client.getPlugins())

        return fn(onMutateContext, () =>
          Promise.resolve(
            this.options.mutationFn!(onMutateContext.variables as TVariables)
          )
        )
      })
      .then(result => {
        data = result
      })
      .then(() => this.options.onSuccess?.(data, variables, context))
      .then(() => this.options.onSettled?.(data, null, variables, context))
      .then(() => options.onSuccess?.(data, variables, context))
      .then(() => options.onSettled?.(data, null, variables, context))
      .then(() => {
        if (mutationId === this.mutationId) {
          this.dispatch({ type: 'success', data })
        }
        return data
      })
      .catch(error => {
        getLogger().error(error)
        return Promise.resolve()
          .then(() => this.options.onError?.(error, variables, context))
          .then(() =>
            this.options.onSettled?.(undefined, error, variables, context)
          )
          .then(() => options.onError?.(error, variables, context))
          .then(() => options.onSettled?.(undefined, error, variables, context))
          .then(() => {
            if (mutationId === this.mutationId) {
              this.dispatch({ type: 'error', error })
            }
            throw error
          })
      })
  }
}

function getDefaultState<TData, TError, TVariables>(): MutationState<
  TData,
  TError,
  TVariables
> {
  return {
    ...getStatusProps('idle'),
    data: undefined,
    error: null,
    variables: undefined,
  }
}

function reducer<TData, TError, TVariables>(
  state: MutationState<TData, TError, TVariables>,
  action: Action<TData, TError, TVariables>
): MutationState<TData, TError, TVariables> {
  switch (action.type) {
    case 'reset':
      return getDefaultState()
    case 'loading':
      return {
        ...state,
        ...getStatusProps('loading'),
        data: undefined,
        error: null,
        variables: action.variables,
      }
    case 'success':
      return {
        ...state,
        ...getStatusProps('success'),
        data: action.data,
        error: null,
      }
    case 'error':
      return {
        ...state,
        ...getStatusProps('error'),
        data: undefined,
        error: action.error,
      }
    default:
      return state
  }
}
