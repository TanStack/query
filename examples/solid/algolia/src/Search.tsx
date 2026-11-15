import { createSignal } from 'solid-js'
import { createDebouncedValue } from '@tanstack/solid-pacer/debouncer'

import SearchResults from './SearchResults'
import type { JSX } from 'solid-js'

export default function Search() {
  const [query, setQuery] = createSignal('')
  const [debouncedQuery] = createDebouncedValue(query, { wait: 300 })

  const handleOnInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (
    event,
  ) => {
    event.preventDefault()
    setQuery(event.currentTarget.value)
  }

  return (
    <div>
      <input
        onInput={handleOnInput}
        value={query()}
        placeholder="Search products"
      />
      <SearchResults query={debouncedQuery()} />
    </div>
  )
}
