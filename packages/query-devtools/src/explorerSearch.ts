import { getNativeObjectType } from './nativeObjectType'

/** Match metadata at one original data path. */
export type SearchMatch = {
  /** Whether the original entry label matches. */
  label: boolean
  /** Whether a primitive value matches. */
  value: boolean
  /** Includes descendants, so rendering never needs to search a subtree again. */
  hasMatch: boolean
  /** Controls safe expansion and terminal display during search. */
  kind: 'branch' | 'value' | 'opaque' | 'circular' | 'accessor'
  /** Entries keyed by their original label, including Map key identity. */
  children: ReadonlyMap<unknown, SearchMatch>
}

/** Search information passed to an individual explorer row. */
export type ExplorerSearch = {
  /** The case-normalized literal search term. */
  term: string
  /** Match metadata for this row's original data path. */
  match: SearchMatch
}

type SearchEntry = {
  key: unknown
  label: string
  value: unknown
  accessor?: boolean
}

/**
 * Converts only primitive values to searchable text.
 * @param value - The inspected value.
 * @returns Primitive text, or undefined for objects and functions.
 */
export function primitiveText(value: unknown): string | undefined {
  if (value === null) return 'null'
  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'bigint':
    case 'symbol':
    case 'undefined':
      return String(value)
    default:
      return undefined
  }
}

/**
 * Reads finite entries through native collection methods and own descriptors.
 * Accessors and user-defined iterators or key conversions are not evaluated.
 * @param value - The inspected value.
 * @returns Original entries, or undefined for opaque values.
 */
export function searchEntries(value: unknown): Array<SearchEntry> | undefined {
  try {
    if (
      value === null ||
      typeof value !== 'object' ||
      ArrayBuffer.isView(value)
    ) {
      return undefined
    }
    const type = getNativeObjectType(value)
    if (type === 'String') return undefined
    if (type === 'Map') {
      return Array.from(Map.prototype.entries.call(value), ([key, entry]) => ({
        key,
        label: primitiveText(key) ?? '[Object key]',
        value: entry,
      }))
    }
    if (type === 'Set') {
      return Array.from(Set.prototype.values.call(value), (entry, index) => ({
        key: String(index),
        label: String(index),
        value: entry,
      }))
    }
    const entries = Object.entries(Object.getOwnPropertyDescriptors(value))
      .filter(([, descriptor]) => descriptor.enumerable)
      .map(([key, descriptor]) => ({
        key,
        label: key,
        value: descriptor.value,
        accessor: !('value' in descriptor),
      }))
    if (
      !Array.isArray(value) &&
      Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null &&
      !entries.some(
        (entry) => !entry.accessor && typeof entry.value !== 'function',
      )
    ) {
      return undefined
    }
    return entries
  } catch {
    return undefined
  }
}

// `toLowerCase` never outputs it, so a lowercased term can't match across two joined parts
const SEARCH_TEXT_SEPARATOR = 'A'

/**
 * Builds the text that `searchExplorer` matches: every entry label and
 * primitive value, lowercased. Visiting breadth-first reaches each object once
 * at its shallowest depth, so shared data is searched once with the same depth
 * bound.
 * @param rootValue - The data to build the search text of.
 * @returns Text that contains a lowercased term exactly when `searchExplorer` matches it.
 */
export function createSearchText(rootValue: unknown): string {
  const rootText = primitiveText(rootValue)
  if (rootText !== undefined) return rootText.toLowerCase()
  const parts: Array<string> = []
  const seen = new Set<unknown>([rootValue])
  const queue: Array<{ value: unknown; depth: number }> = [
    { value: rootValue, depth: 0 },
  ]
  // Also visits the entries pushed while iterating
  for (const { value, depth } of queue) {
    for (const entry of searchEntries(value) ?? []) {
      parts.push(entry.label.toLowerCase())
      if (entry.accessor) continue
      const text = primitiveText(entry.value)
      if (text !== undefined) {
        parts.push(text.toLowerCase())
      } else if (
        depth < 500 &&
        typeof entry.value === 'object' &&
        !seen.has(entry.value)
      ) {
        seen.add(entry.value)
        queue.push({ value: entry.value, depth: depth + 1 })
      }
    }
  }
  return parts.join(SEARCH_TEXT_SEPARATOR)
}

/**
 * Builds one search tree, stopping ancestor cycles while visiting shared siblings.
 * @param rootValue - The current root data.
 * @param term - The case-normalized literal search term.
 * @returns Match and safe rendering metadata for every original entry.
 */
export function searchExplorer(rootValue: unknown, term: string): SearchMatch {
  const ancestors = new Set<unknown>()
  /**
   * Visits one original path with its current ancestors.
   * @param value - The entry value.
   * @param label - The entry label; absent for the synthetic root.
   * @param accessor - Whether reading the entry would invoke a getter.
   * @param depth - The current nesting depth.
   * @returns The entry's match metadata.
   */
  function visit(
    value: unknown,
    label?: string,
    accessor = false,
    depth = 0,
  ): SearchMatch {
    const labelMatch = label?.toLowerCase().includes(term) ?? false
    const text = accessor ? undefined : primitiveText(value)
    const valueMatch = text?.toLowerCase().includes(term) ?? false
    const children = new Map<unknown, SearchMatch>()
    const match: SearchMatch = {
      label: labelMatch,
      value: valueMatch,
      hasMatch: labelMatch || valueMatch,
      kind: accessor ? 'accessor' : text !== undefined ? 'value' : 'opaque',
      children,
    }
    if (accessor || text !== undefined) return match
    if (depth > 500) return match
    if (ancestors.has(value)) {
      match.kind = 'circular'
      return match
    }
    const entries = searchEntries(value)
    if (!entries) return match
    match.kind = 'branch'
    ancestors.add(value)
    for (const entry of entries) {
      const child = visit(entry.value, entry.label, entry.accessor, depth + 1)
      children.set(entry.key, child)
      match.hasMatch ||= child.hasMatch
    }
    ancestors.delete(value)
    return match
  }
  return visit(rootValue)
}
