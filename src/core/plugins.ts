import type { Mutation } from './mutation'
import type { Query } from './query'
import type { QueryClient } from './queryClient'
import type { MutationOptions, QueryOptions } from './types'
import { isDefined } from './utils'

// TYPES

export interface Plugin {
  onQuery?: OnQueryPluginFunction
  onMutate?: OnMutatePluginFunction
}

export type OnQueryPluginFunction = MiddlewareFunction<OnQueryContext>
export type OnMutatePluginFunction = MiddlewareFunction<OnMutateContext>

export interface OnQueryContext {
  client: QueryClient
  query: Query<any, any, any>
  options: QueryOptions<any, any, any>
  params: unknown[]
}

export interface OnMutateContext {
  client: QueryClient
  mutation: Mutation<any, any, any, any>
  options: MutationOptions<any, any, any, any>
  variables: unknown
}

type MiddlewareFunction<TContext, TResult = unknown> = (
  context: TContext,
  next: () => Promise<TResult>
) => Promise<TResult>

// FUNCTIONS

export function composeOnQuery<TResult>(
  plugins: Plugin[]
): MiddlewareFunction<OnQueryContext, TResult> {
  return composeMiddleware(
    plugins
      .map(x => x.onQuery as MiddlewareFunction<OnQueryContext, TResult>)
      .filter(isDefined)
  )
}

export function composeOnMutate<TResult>(
  plugins: Plugin[]
): MiddlewareFunction<OnMutateContext, TResult> {
  return composeMiddleware(
    plugins
      .map(x => x.onMutate as MiddlewareFunction<OnMutateContext, TResult>)
      .filter(isDefined)
  )
}

function composeMiddleware<TContext, TResult>(
  middlewares: MiddlewareFunction<TContext, TResult>[]
): MiddlewareFunction<TContext, TResult> {
  return (context, next) => {
    let index = -1

    function dispatch(i: number): Promise<TResult> {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'))
      }

      index = i

      const fn = i === middlewares.length ? next : middlewares[i]

      try {
        return Promise.resolve(fn(context, () => dispatch(i + 1)))
      } catch (error) {
        return Promise.reject(error)
      }
    }

    return dispatch(0)
  }
}
