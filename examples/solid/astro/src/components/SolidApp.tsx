import {
  QueryClient,
  QueryClientProvider,
  keepPreviousData,
  useQuery,
} from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import {
  For,
  Show,
  Suspense,
  createContext,
  createSignal,
  useContext,
} from 'solid-js'
import { isServer } from 'solid-js/web'
import { getSearchParams, properCase } from '../utils'
import { Link } from './Link'

const PokemonIdContext = createContext<() => string>()

const usePokemonID = () => {
  const id = useContext(PokemonIdContext)
  if (!id) throw new Error('PokemonIdContext not found')
  return id
}

const MAX_POKEMONS = 100

export const SolidApp = (props: { pokemon?: string }) => {
  const client = new QueryClient()

  const search = getSearchParams(props.pokemon || '')

  return (
    <QueryClientProvider client={client}>
      <SolidQueryDevtools />
      <Suspense fallback={'Loading'}>
        <PokemonIdContext.Provider value={search}>
          <App />
        </PokemonIdContext.Provider>
      </Suspense>
    </QueryClientProvider>
  )
}

const App = () => {
  return (
    <div class="flex flex-1 overflow-auto">
      <SideNav />
      <PokemonDetails />
    </div>
  )
}

const PokemonDetails = () => {
  const id = usePokemonID()
  return (
    <div class="flex-1 flex">
      <Show when={id()}>
        <Suspense fallback={'Loading'}>
          <PokemonDex id={id()} />
        </Suspense>
      </Show>
      <Show when={!id()}>
        <div class="justify-center items-center flex-1 flex text-2xl font-medium text-zinc-700">
          <div class="">Select a pokemon to see its stats</div>
        </div>
      </Show>
    </div>
  )
}

const PokemonDex = (props: { id: string }) => {
  const pokemon = useQuery(() => ({
    queryKey: ['pokemon', props.id],
    queryFn: async () => {
      const res = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${props.id}`,
      ).then((res) => res.json())
      return res
    },
    placeholderData: keepPreviousData,
  }))

  const pokemon_stats = useQuery(() => ({
    queryKey: ['pokemon', props.id],
    queryFn: async () => {
      const res = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${props.id}`,
      ).then((res) => res.json())

      return res
    },
    select(data) {
      const nameMap = {
        hp: 'HP',
        attack: 'Attack',
        defense: 'Defense',
        'special-attack': 'Special Attack',
        'special-defense': 'Special Defense',
        speed: 'Speed',
      }
      const stats = data.stats.map((stat: any) => ({
        name: nameMap[stat.stat.name as keyof typeof nameMap],
        value: stat.base_stat,
      }))
      return stats as { name: string; value: number }[]
    },
    placeholderData: keepPreviousData,
    reconcile: 'name',
  }))

  const is_server_rendered = useQuery(() => ({
    queryKey: ['is_server_rendered', props.id],
    queryFn: () => {
      if (isServer) return true
      return false
    },
    placeholderData: keepPreviousData,
  }))

  return (
    <div class="flex flex-col flex-1">
      <Show when={pokemon.data}>
        <div class="flex justify-center text-3xl font-semibold py-4">
          {properCase(pokemon.data.name)}
        </div>
        <div class="flex justify-center">
          <div class="h-64 w-64 rounded-lg relative overflow-hidden border">
            <img
              class="h-[400%] w-[400%] max-w-[400%] object-contain blur-2xl brightness-125 contrast-150 absolute z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${props.id}.png`}
              alt={properCase(pokemon.data?.name || '')}
            />
            <img
              class="h-full w-full object-contain relative z-20"
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${props.id}.png`}
              alt={properCase(pokemon.data?.name || '')}
            />
          </div>
        </div>
      </Show>

      <div class="flex justify-center py-4">
        <div>
          This query was rendered on the{' '}
          <Show
            when={is_server_rendered.data}
            fallback={
              <>
                <b>client</b>. Reload this page to see the page rendered on the
                server.
              </>
            }
          >
            <b>server. </b>
            Click on another pokemon to see queries run and render on the
            client.
          </Show>
        </div>
      </div>

      <Show when={pokemon_stats.data}>
        <div class="flex justify-center flex-col gap-2">
          <For each={pokemon_stats.data}>
            {(stat) => (
              <div class="flex gap-2 justify-center items-center">
                <div class="w-36">{stat.name}</div>
                <div class="w-80 h-8 relative bg-zinc-100 rounded overflow-hidden flex justify-center items-center">
                  <div
                    class="absolute z-10 h-full top-0 left-0 bg-lime-300"
                    style={{
                      width: `${(stat.value / 160) * 100}%`,
                      transition: 'width 0.5s',
                    }}
                  ></div>
                  <div class="relative z-20 text-sm mix-blend-darken font-semibold">
                    {stat.value}
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}

const SideNav = () => {
  const id = usePokemonID()

  const pokemonsList = useQuery(() => ({
    queryKey: ['pokemons'],
    queryFn: async () => {
      const res = await fetch(
        `https://pokeapi.co/api/v2/pokemon?limit=${MAX_POKEMONS}`,
      ).then((res) => res.json())
      return res as {
        results: { name: string; url: string }[]
      }
    },
    select(data) {
      return data.results.map((p) => {
        const regex = /\/pokemon\/(\d+)\/$/
        const match = p.url.match(regex)
        const id = match ? match[1] : ''
        return {
          name: properCase(p.name),
          id,
          avatar: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
        }
      })
    },
    placeholderData: keepPreviousData,
    reconcile: 'id',
  }))

  const activeClass = (pokemonID: string) =>
    id() === pokemonID ? 'bg-gray-50' : 'hover:bg-gray-50'

  return (
    <div class="w-72 border-r flex flex-col px-2">
      <div class="pt-3 pb-1 text-sm font-semibold">Pokemons</div>

      <div class="flex-1 overflow-auto flex flex-col gap-1">
        <For each={pokemonsList.data}>
          {(pokemon) => (
            <Link
              class={`flex gap-2 items-center border rounded p-1 ${activeClass(
                pokemon.id,
              )}`}
              href={`./?id=${pokemon.id}`}
            >
              <span class="flex bg-zinc-100 border relative justify-center items-center overflow-hidden rounded-sm w-9 h-9 flex-shrink-0">
                <img
                  class="w-7 h-7 relative z-20"
                  src={pokemon.avatar}
                  alt={pokemon.name}
                />
              </span>
              <span>{pokemon.name}</span>
            </Link>
          )}
        </For>
      </div>
    </div>
  )
}
