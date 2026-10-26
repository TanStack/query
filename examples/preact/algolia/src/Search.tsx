import { useState } from 'preact/hooks'

import SearchResults from './SearchResults'
import type { TargetedEvent } from 'preact'

export default function Search() {
  const [query, setQuery] = useState('')

  const handleOnInput = (event: TargetedEvent<HTMLInputElement>) => {
    event.preventDefault()
    // It is recommended to debounce this event in prod
    setQuery(event.currentTarget.value)
  }

  return (
    <div>
      <input
        onInput={handleOnInput}
        value={query}
        placeholder="Search products"
      />
      <SearchResults query={query} />
    </div>
  )
}
