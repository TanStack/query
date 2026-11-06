import { useState } from 'preact/hooks'
import { useDebouncedValue } from '@tanstack/preact-pacer/debouncer'

import SearchResults from './SearchResults'
import type { TargetedEvent } from 'preact'

export default function Search() {
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebouncedValue(query, { wait: 300 })

  const handleOnInput = (event: TargetedEvent<HTMLInputElement>) => {
    event.preventDefault()
    setQuery(event.currentTarget.value)
  }

  return (
    <div>
      <input
        onInput={handleOnInput}
        value={query}
        placeholder="Search products"
      />
      <SearchResults query={debouncedQuery} />
    </div>
  )
}
