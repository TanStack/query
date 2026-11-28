import type { placeholderData } from './placeholderData'
import type { select } from './select'

/** An option created by `select(transform)` that supplies the selector and its observer implementation. */
export type Select<TInput, TData> = () => readonly [
  feature: typeof select,
  value: (data: TInput) => TData,
]

/** Placeholder data (or a factory) paired with its observer implementation. */
export type PlaceholderData<TData, TQuery> = readonly [
  feature: typeof placeholderData,
  value:
    // oxlint-disable-next-line typescript/no-unsafe-function-type -- excludes all callable and constructable values
    | (TData extends Function ? never : TData)
    | ((
        previousData: TData | undefined,
        previousQuery: TQuery | undefined,
      ) => TData | undefined),
]
