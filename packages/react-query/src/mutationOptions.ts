import type {
  DataTag,
  DefaultError,
  InitialDataFunction,
  MutationFunction,
  OmitKeyof,
  SkipToken,
} from '@tanstack/query-core'
import type { UseMutationOptions } from './types'

export type UndefinedInitialDataOptions<
  TMutationFnData = unknown,
  TError = DefaultError,
  TData = void,
  TMutationKey = unknown,
> = UseMutationOptions<TMutationFnData, TError, TData, TMutationKey> & {
  initialData?:
    | undefined
    | InitialDataFunction<NonUndefinedGuard<TMutationFnData>>
    | NonUndefinedGuard<TMutationFnData>
}

export type UnusedSkipTokenOptions<
  TMutationFnData = unknown,
  TError = DefaultError,
  TData = void,
  TMutationKey = unknown,
> = OmitKeyof<
  UseMutationOptions<TMutationFnData, TError, TData, TMutationKey>,
  'mutationFn'
> & {
  mutationFn?: Exclude<
    UseMutationOptions<
      TMutationFnData,
      TError,
      TData,
      TMutationKey
    >['mutationFn'],
    SkipToken | undefined
  >
}

type NonUndefinedGuard<T> = T extends undefined ? never : T

export type DefinedInitialDataOptions<
  TMutationFnData = unknown,
  TError = DefaultError,
  TData = void,
  TMutationKey = unknown,
> = Omit<
  UseMutationOptions<TMutationFnData, TError, TData, TMutationKey>,
  'mutationFn'
> & {
  initialData:
    | NonUndefinedGuard<TMutationFnData>
    | (() => NonUndefinedGuard<TMutationFnData>)
  mutationFn?: MutationFunction<TMutationFnData, TMutationKey>
}

export function mutationOptions<
  TMutationFnData = unknown,
  TError = DefaultError,
  TData = void,
  TMutationKey = unknown,
>(
  options: DefinedInitialDataOptions<
    TMutationFnData,
    TError,
    TData,
    TMutationKey
  >,
): DefinedInitialDataOptions<TMutationFnData, TError, TData, TMutationKey> & {
  mutationKey: DataTag<TMutationKey, TMutationFnData, TError>
}

export function mutationOptions<
  TMutationFnData = unknown,
  TError = DefaultError,
  TData = void,
  TMutationKey = unknown,
>(
  options: UnusedSkipTokenOptions<TMutationFnData, TError, TData, TMutationKey>,
): UnusedSkipTokenOptions<TMutationFnData, TError, TData, TMutationKey> & {
  mutationKey: DataTag<TMutationKey, TMutationFnData, TError>
}

export function mutationOptions<
  TMutationFnData = unknown,
  TError = DefaultError,
  TData = void,
  TMutationKey = unknown,
>(
  options: UndefinedInitialDataOptions<
    TMutationFnData,
    TError,
    TData,
    TMutationKey
  >,
): UndefinedInitialDataOptions<TMutationFnData, TError, TData, TMutationKey> & {
  mutationKey: DataTag<TMutationKey, TMutationFnData, TError>
}

export function mutationOptions(options: unknown) {
  return options
}
