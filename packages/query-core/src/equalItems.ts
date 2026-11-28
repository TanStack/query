/**
 * Checks an ordered list of dependencies or snapshots without enumerating their indices.
 * @param items - The current items.
 * @param previous - The previous items, if available.
 * @param equal - The comparison for each item. Defaults to reference equality.
 * @returns Whether both lists have equal items at every index.
 */
export function equalItems<T>(
  items: ReadonlyArray<T>,
  previous: ReadonlyArray<T> | undefined,
  equal: (item: T, previous: T) => boolean = (a, b) => a === b,
): boolean {
  return (
    !!previous &&
    items.length === previous.length &&
    items.every((item, index) => equal(item, previous[index]!))
  )
}
