'use client'

import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { pokemonsQueries } from '../services/pokemons/queries'

export function PokemonInfo() {
  const { data } = useQuery(pokemonsQueries.detail(25))

  return (
    <div>
      <figure>
        <img src={data.sprites.front_shiny} height={200} alt={data.name} />
        <h2>I'm {data.name}</h2>
      </figure>
    </div>
  )
}
