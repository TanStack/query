import { expect } from 'vitest'

export function normalizeIndent(template: TemplateStringsArray) {
  const codeLines = template[0]?.split('\n') ?? ['']
  const leftPadding = codeLines[1]?.match(/\s+/)?.[0] ?? ''
  return codeLines.map((line) => line.slice(leftPadding.length)).join('\n')
}

export function generatePermutations<T>(arr: Array<T>): Array<Array<T>> {
  if (arr.length <= 1) {
    return [arr]
  }

  const result: Array<Array<T>> = []
  for (let i = 0; i < arr.length; i++) {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1))
    const restPermutations = generatePermutations(rest)
    for (const perm of restPermutations) {
      result.push([arr[i]!, ...perm])
    }
  }

  return result
}

export function generatePartialCombinations<T>(
  arr: ReadonlyArray<T>,
  minLength: number,
): Array<Array<T>> {
  const result: Array<Array<T>> = []

  function backtrack(start: number, current: Array<T>) {
    if (current.length > minLength - 1) {
      result.push([...current])
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]!)
      backtrack(i + 1, current)
      current.pop()
    }
  }
  backtrack(0, [])
  return result
}

export function expectArrayEqualIgnoreOrder<T>(a: Array<T>, b: Array<T>) {
  expect([...a].sort()).toEqual([...b].sort())
}

export function generateInterleavedCombinations<
  TData,
  TAdditional,
  TResult extends TData | TAdditional,
>(
  data: Array<TData> | ReadonlyArray<TData>,
  additional: Array<TAdditional> | ReadonlyArray<TAdditional>,
): Array<Array<TResult>> {
  const result: Array<Array<TResult>> = []

  function getSubsets(array: Array<TAdditional>): Array<Array<TAdditional>> {
    return array.reduce(
      (subsets, value) => {
        return subsets.concat(subsets.map((set) => [...set, value]))
      },
      [[]] as Array<Array<TAdditional>>,
    )
  }

  function insertAtPositions(
    baseData: Array<TResult>,
    subset: Array<TResult>,
  ): Array<Array<TResult>> {
    const combinations: Array<Array<TResult>> = []

    const recurse = (
      currentData: Array<TResult>,
      currentSubset: Array<TResult>,
      start: number,
    ): void => {
      if (currentSubset.length === 0) {
        combinations.push([...currentData])
        return
      }

      for (let i = start; i <= currentData.length; i++) {
        const newData = [
          ...currentData.slice(0, i),
          currentSubset[0]!,
          ...currentData.slice(i),
        ]
        recurse(newData, currentSubset.slice(1), i + 1)
      }
    }

    recurse(baseData, subset, 0)
    return combinations
  }

  const subsets = getSubsets(additional as Array<TAdditional>)

  subsets.forEach((subset) => {
    result.push(
      ...insertAtPositions(data as Array<TResult>, subset as Array<TResult>),
    )
  })

  return result
}
