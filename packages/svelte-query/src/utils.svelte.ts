import { untrack } from 'svelte'
// modified from the great https://github.com/svecosystem/runed
function runEffect(
  flush: 'post' | 'pre',
  effect: () => void | VoidFunction,
): void {
  switch (flush) {
    case 'post':
      $effect(effect)
      break
    case 'pre':
      $effect.pre(effect)
      break
  }
}
type Getter<T> = () => T
export const watchChanges = <T>(
  sources: Getter<T> | Array<Getter<T>>,
  flush: 'post' | 'pre',
  effect: (
    values: T | Array<T>,
    previousValues: T | undefined | Array<T | undefined>,
  ) => void,
) => {
  let active = false
  let previousValues: T | undefined | Array<T | undefined> = Array.isArray(
    sources,
  )
    ? []
    : undefined
  runEffect(flush, () => {
    const values = Array.isArray(sources)
      ? sources.map((source) => source())
      : sources()
    if (!active) {
      active = true
      previousValues = values
      return
    }
    const cleanup = untrack(() => effect(values, previousValues))
    previousValues = values
    return cleanup
  })
}
