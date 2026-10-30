import { createSignal } from 'solid-js'

import SearchResults from './SearchResults'
import type { JSX } from 'solid-js'

export default function Search() {
  const [query, setQuery] = createSignal('')

  const handleOnInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (
    event,
  ) => {
    event.preventDefault()
    // It is recommended to debounce this event in prod
    setQuery(event.currentTarget.value)
  }

  return (
    <div>
      <input
        onInput={handleOnInput}
        value={query()}
        placeholder="Search products"
      />
      <SearchResults query={query()} />
    </div>
  )
}
