export function sortDataByOrder<T, TKey extends keyof T>(
  data: Array<T> | ReadonlyArray<T>,
  orderArray: Array<T[TKey]> | ReadonlyArray<T[TKey]>,
  key: TKey,
): Array<T> | null {
  const orderMap = new Map(orderArray.map((item, index) => [item, index]))

  // Separate items that are in orderArray from those that are not
  const inOrderArray = data
    .filter((item) => orderMap.has(item[key]))
    .sort((a, b) => {
      const indexA = orderMap.get(a[key])!
      const indexB = orderMap.get(b[key])!

      return indexA - indexB
    })

  const inOrderIterator = inOrderArray.values()

  // `as boolean` is needed to avoid TS incorrectly inferring that wasResorted is always `true`
  let wasResorted = false as boolean

  const result = data.map((item) => {
    if (orderMap.has(item[key])) {
      const sortedItem = inOrderIterator.next().value!
      if (sortedItem[key] !== item[key]) {
        wasResorted = true
      }
      return sortedItem
    }
    return item
  })

  if (!wasResorted) {
    return null
  }
  return result
}
