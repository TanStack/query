import React from 'react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'

import { pokemonOptions } from '@/app/pokemon'
import { getQueryClient } from '@/app/get-query-client'
import { PokemonInfo } from '@/app/pokemon-info'

export default async function Home() {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery(pokemonOptions)

  return (
    <main>
      <h1>Pokemon Info</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PokemonInfo />
      </HydrationBoundary>
    </main>
  )
}
