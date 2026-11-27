export { refetchInterval } from '../src'

export type IntervalInput<TOption> = Extract<
  TOption,
  { value: unknown }
>['value']
