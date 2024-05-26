'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { pokemonOptions } from '@/app/pokemon'

export function PokemonInfo() {
  const { data } = useQuery(pokemonOptions)

  if (!data) {
    return <div>Loading...</div>
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
