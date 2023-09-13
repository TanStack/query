export function uniqueBy<T>(arr: Array<T>, fn: (x: T) => unknown): Array<T> {
  return arr.filter((x, i, a) => a.findIndex((y) => fn(x) === fn(y)) === i)
}
