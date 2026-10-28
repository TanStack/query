import React from 'react'
import { HydrationBoundary, dehydrate, noop } from '@tanstack/react-query'
import { pokemonsQueries } from '../services/pokemons/queries'
import { PokemonInfo } from './pokemon-info'
import { getQueryClient } from '@/app/get-query-client'

export default function Home() {
  const queryClient = getQueryClient()

  void queryClient.query(pokemonsQueries.detail(25)).catch(noop)

  return (
    <main>
      <h1>Pokemon Info</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PokemonInfo />
      </HydrationBoundary>
    </main>
  )
}
