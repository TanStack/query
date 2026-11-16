'use client'

import React from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { pokemonsQueries } from '../services/pokemons/queries'

export function PokemonInfo() {
  const { data } = useSuspenseQuery(pokemonsQueries.detail(25))

  return (
    <div>
      <figure>
        <img src={data.sprites.front_shiny} height={200} alt={data.name} />
        <h2>I'm {data.name}</h2>
      </figure>
    </div>
  )
}
