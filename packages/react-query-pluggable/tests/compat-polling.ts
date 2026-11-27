export { refetchInterval } from '@tanstack/query-core-pluggable'

export type IntervalInput<TOption> = Extract<
  TOption,
  { value: unknown }
>['value']
