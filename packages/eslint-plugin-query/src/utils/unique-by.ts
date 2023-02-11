export function uniqueBy<T>(arr: T[], fn: (x: T) => unknown): T[] {
  return arr.filter((x, i, a) => a.findIndex((y) => fn(x) === fn(y)) === i)
}
