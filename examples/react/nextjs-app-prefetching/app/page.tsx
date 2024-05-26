import React from 'react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { makeQueryClient } from '@/app/make-query-client'
import { pokemonOptions } from '@/app/pokemon'
import { PokemonInfo } from './pokemon-info'

export default async function Home() {
  const queryClient = makeQueryClient()

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
