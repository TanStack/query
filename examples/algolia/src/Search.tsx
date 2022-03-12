import { useState } from 'react'

import SearchResults from './SearchResults'

export default function Search() {
  const [query, setQuery] = useState('')

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
      <SearchResults query={query} />
    </div>
  )
}
