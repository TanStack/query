import {
  Injector,
  assertInInjectionContext,
  computed,
  inject,
  resourceFromSnapshots,
  runInInjectionContext,
  untracked,
} from '@angular/core'
import { createMutationResult } from './inject-mutation'
import type { ResourceSnapshot } from '@angular/core'
import type { DefaultError } from '@tanstack/query-core'
import type { CreateBaseMutationResult, CreateMutationOptions } from './types'
import type {
  MutationResource,
  MutationResourceConfig,
  MutationResourceOptionsFn,
  QueryResourceInjectorOptions,
} from './resource/resource-types'

/**
 * Projects a mutation result onto Angular's `ResourceSnapshot` shape.
 *
 * | Mutation status | Resource status |
 * | --------------- | --------------- |
 * | `idle`          | `idle`          |
 * | `pending`       | `loading`       |
 * | `success`       | `resolved`      |
 * | `error`         | `error`         |
 */
function toMutationSnapshot<TData, TError, TVariables, TOnMutateResult>(
  result: CreateBaseMutationResult<TData, TError, TVariables, TOnMutateResult>,
): ResourceSnapshot<TData | undefined> {
  switch (result.status) {
    case 'error':
      return { status: 'error', error: result.error as Error }
    case 'pending':
      return { status: 'loading', value: result.data }
    case 'success':
      return { status: 'resolved', value: result.data }
    default:
      return { status: 'idle', value: undefined }
  }
}

/**
 * Creates a mutation whose handle is an Angular `Resource`.
 *
 * The resource-shaped counterpart of `injectMutation`. Backed by the same
 * `MutationObserver` / `MutationCache`. The resource `value` is the result of the most
 * recent mutation; trigger it imperatively with `mutate` / `mutateAsync`.
 *
 * **Config form (this overload).**
 *
 * ```ts
 * addTodo = mutationResource({
 *   mutationFn: (title: string) => api.addTodo(title),
 *   onSuccess: () => this.queryClient.invalidateQueries({ queryKey: ['todos'] }),
 * })
 * // addTodo.mutate('Write docs'); addTodo.isPending(); addTodo.value()
 * ```
 * @param config - The mutation options as a config object.
 * @param options - Additional configuration such as the `Injector` to use.
 * @returns A resource-shaped mutation handle.
 */
export function mutationResource<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  config: MutationResourceConfig<TData, TError, TVariables, TOnMutateResult>,
  options?: QueryResourceInjectorOptions,
): MutationResource<TData, TError, TVariables, TOnMutateResult>

/**
 * Creates a mutation whose handle is an Angular `Resource`.
 *
 * **Options-function form (this overload).** Whole-object reactive, identical
 * semantics to `injectMutation(() => ({ ... }))`.
 * @param optionsFn - A function that returns the mutation options.
 * @param options - Additional configuration such as the `Injector` to use.
 * @returns A resource-shaped mutation handle.
 */
export function mutationResource<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  optionsFn: MutationResourceOptionsFn<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >,
  options?: QueryResourceInjectorOptions,
): MutationResource<TData, TError, TVariables, TOnMutateResult>

export function mutationResource(
  arg: MutationResourceConfig | MutationResourceOptionsFn,
  options?: QueryResourceInjectorOptions,
): MutationResource {
  !options?.injector && assertInInjectionContext(mutationResource)
  const injector = options?.injector ?? inject(Injector)
  return runInInjectionContext(injector, () => {
    const optionsFn = (
      typeof arg === 'function' ? arg : () => arg
    ) as () => CreateMutationOptions
    const result = createMutationResult(optionsFn, injector)
    const resourceRef = resourceFromSnapshots(() =>
      toMutationSnapshot(result()),
    )

    return {
      // Angular Resource surface.
      value: resourceRef.value,
      status: resourceRef.status,
      error: resourceRef.error,
      isLoading: resourceRef.isLoading,
      snapshot: resourceRef.snapshot,
      hasValue: (() =>
        resourceRef.hasValue()) as MutationResource['hasValue'],

      // Mutation result fields.
      data: computed(() => result().data),
      mutationStatus: computed(() => result().status),
      variables: computed(() => result().variables),
      submittedAt: computed(() => result().submittedAt),
      isIdle: computed(() => result().isIdle),
      isPending: computed(() => result().isPending),
      isSuccess: computed(() => result().isSuccess),
      isError: computed(() => result().isError),
      failureCount: computed(() => result().failureCount),
      failureReason: computed(() => result().failureReason),

      // Actions.
      mutate: (variables, mutateOptions) =>
        untracked(() => result().mutate(variables, mutateOptions)),
      mutateAsync: (variables, mutateOptions) =>
        untracked(() => result().mutateAsync(variables, mutateOptions)),
      reset: () => untracked(() => result().reset()),
    } as MutationResource
  })
}
