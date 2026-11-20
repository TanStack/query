import { createSignal } from 'solid-js'

export const getSearchParams = (init: string) => {
  const [search, setSearch] = createSignal(init)
  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => {
      const location = window.location
      const params = new URLSearchParams(location.search)
      setSearch(params.get('id') || '')
    })
  }
  return search
}

export const properCase = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1)
