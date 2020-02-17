import { queries } from './utils'

export function clearQueryCache() {
  queries.length = 0
}
