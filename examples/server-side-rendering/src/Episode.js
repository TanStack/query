import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import fetch from './fetch'

const fetchEpisode = (key, episodeId) =>
  fetch(`https://rickandmortyapi.com/api/episode/${episodeId}`)

function Episode() {
  const { episodeId } = useParams()
  const { status, data } = useQuery(['episode', episodeId], fetchEpisode)

  let episode
  if (status === 'loading') {
    episode = <p>Loading ...</p>
  } else if (status === 'error') {
    episode = <p>Error :(</p>
  } else if (status === 'success' && data) {
    episode = (
      <>
        <h1>{data.name}</h1>
        <p>Air date: {data.air_date}</p>
      </>
    )
  }

  return (
    <>
      <Link to="/">Start</Link>
      {episode}
    </>
  )
}

Episode.prefetch = (queryCache, params) =>
  queryCache.prefetchQuery(['episode', params.episodeId], fetchEpisode)

export default Episode
