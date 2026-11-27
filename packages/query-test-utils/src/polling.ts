// The v6 and integrated adapters accept the interval directly. The pluggable
// compatibility suite resolves this module to its public polling factory.
export function refetchInterval<T>(option: T): T {
  return option
}

export type IntervalInput<TOption> = TOption
