import type { RuntimeBinding } from './binding'
import type { MutationObserverResult } from './types'

export type MutationObserverListener<
  TRuntime extends RuntimeBinding,
  TData,
  TError,
  TVariables,
  TOnMutateResult,
> = (
  result: MutationObserverResult<
    TRuntime,
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >,
) => void
