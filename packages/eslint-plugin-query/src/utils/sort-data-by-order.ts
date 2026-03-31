export function sortDataByOrder<T, TKey extends keyof T>(
  data: Array<T> | ReadonlyArray<T>,
  orderRules: ReadonlyArray<
    Readonly<[ReadonlyArray<T[TKey]>, ReadonlyArray<T[TKey]>]>
  >,
  key: TKey,
): Array<T> | null {
  const getSubsetIndex = (
    item: T[TKey],
    subsets: ReadonlyArray<ReadonlyArray<T[TKey]> | Array<T[TKey]>>,
  ): number | null => {
    for (let i = 0; i < subsets.length; i++) {
      if (subsets[i]?.includes(item)) {
        return i
      }
    }
    return null
  }

  const orderSets = orderRules.reduce(
    (sets, [A, B]) => [...sets, A, B],
    [] as Array<ReadonlyArray<T[TKey]> | Array<T[TKey]>>,
  )

  const inOrderArray = data.filter(
    (item) => getSubsetIndex(item[key], orderSets) !== null,
  )

  let wasResorted = false as boolean

  // Sort by the relative order defined by the rules
  const sortedArray = inOrderArray.sort((a, b) => {
    const aKey = a[key],
      bKey = b[key]
    const aSubsetIndex = getSubsetIndex(aKey, orderSets)
    const bSubsetIndex = getSubsetIndex(bKey, orderSets)

    // If both items belong to different subsets, sort by their subset order
    if (
      aSubsetIndex !== null &&
      bSubsetIndex !== null &&
      aSubsetIndex !== bSubsetIndex
    ) {
      return aSubsetIndex - bSubsetIndex
    }

    // If both items belong to the same subset or neither is in the subset, keep their relative order
    return 0
  })

  const inOrderIterator = sortedArray.values()
  const result = data.map((item) => {
    if (getSubsetIndex(item[key], orderSets) !== null) {
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
