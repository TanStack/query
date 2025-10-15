'use client'

import React from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { pokemonOptions } from '@/app/pokemon'

export function PokemonInfo() {
  const { data, isLoading, error } = useSuspenseQuery(pokemonOptions)

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div>
      <figure>
        <img src={data.sprites.front_shiny} height={200} alt={data.name} />
        <h2>I'm {data.name}</h2>
      </figure>
    </div>
  )
}
