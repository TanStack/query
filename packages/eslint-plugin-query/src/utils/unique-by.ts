/**
 * Removes duplicate items, keeping the first item for each key.
 * @param arr - The items.
 * @param fn - Returns the key that identifies an item.
 * @returns The items with unique keys, in their original order.
 */
export function uniqueBy<T>(arr: Array<T>, fn: (x: T) => unknown): Array<T> {
  return arr.filter((x, i, a) => a.findIndex((y) => fn(x) === fn(y)) === i)
}
