declare const dataTagSymbol: unique symbol
type dataTagSymbol = typeof dataTagSymbol

declare const dataTagErrorSymbol: unique symbol
type dataTagErrorSymbol = typeof dataTagErrorSymbol

declare const unsetMarker: unique symbol
type unsetMarker = typeof unsetMarker

declare const skipToken: unique symbol
type skipToken = typeof skipToken

declare const defaultQueryFn: unique symbol
type defaultQueryFn = typeof defaultQueryFn

declare const fetchSignal: unique symbol
type fetchSignal = typeof fetchSignal

export type {
  dataTagSymbol,
  dataTagErrorSymbol,
  unsetMarker,
  skipToken,
  defaultQueryFn,
  fetchSignal,
}
