import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import fetch from './fetch'

const fetchCharacter = (key, characterId) =>
  fetch(`https://rickandmortyapi.com/api/character/${characterId}`)

function Character() {
  const { characterId } = useParams()
  const { status, data } = useQuery(['character', characterId], fetchCharacter)

  let character
  if (status === 'loading') {
    character = <p>Loading ...</p>
  } else if (status === 'error') {
    character = <p>Error :(</p>
  } else if (status === 'success' && data) {
    character = (
      <>
        <h1>{data.name}</h1>
        <p>Gender: {data.gender}</p>
        <p>Status: {data.status}</p>
        <p>Species: {data.species}</p>
      </>
    )
  }

  return (
    <>
      <Link to="/">Start</Link>
      {character}
    </>
  )
}

Character.prefetch = (queryCache, params) =>
  queryCache.prefetchQuery(['character', params.characterId], fetchCharacter)

export default Character
