import React from 'react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '@/app/get-query-client'
import { pokemonOptions } from '@/app/pokemon'
import { PokemonInfo } from './pokemon-info'

export default async function Home() {
  const queryClient = getQueryClient()

  void queryClient.prefetchQuery(pokemonOptions)

  return (
    <main>
      <h1>Pokemon Info</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PokemonInfo />
      </HydrationBoundary>
    </main>
  )
}
