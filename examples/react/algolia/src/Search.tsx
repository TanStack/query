import * as React from 'react'

import SearchResults from './SearchResults'

export default function Search() {
  const [query, setQuery] = React.useState('')

  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault()
    // It is recommended to debounce this event in prod
    setQuery(event.target.value)
  }

  return (
    <div>
      <input
        onChange={handleOnChange}
        value={query}
        placeholder="Search products"
      />
      <SearchResults query={query} />
    </div>
  )
}
