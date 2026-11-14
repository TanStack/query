import { useDebouncedValue } from '@tanstack/react-pacer/debouncer'
import * as React from 'react'
import SearchResults from './SearchResults'

export default function Search() {
  const [query, setQuery] = React.useState('')
  const [debouncedQuery] = useDebouncedValue(query, { wait: 300 })

  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault()
    setQuery(event.target.value)
  }

  return (
    <div>
      <input
        onChange={handleOnChange}
        value={query}
        placeholder="Search products"
      />
      <SearchResults query={debouncedQuery} />
    </div>
  )
}
