import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import fetch from './fetch'

const fetchCharacters = () =>
  fetch('https://rickandmortyapi.com/api/character/')
const fetchEpisodes = () => fetch('https://rickandmortyapi.com/api/episode')

function Home() {
  const { status, data } = useQuery('characters', fetchCharacters)
  const { status: episodeStatus, data: episodeData } = useQuery(
    'episodes',
    fetchEpisodes
  )

  let characters
  if (status === 'loading') {
    characters = <p>Loading ...</p>
  } else if (status === 'error') {
    characters = <p>Error :(</p>
  } else if (status === 'success' && data) {
    characters = (
      <>
        <h1>Characters</h1>
        <ul>
          {data.results
            .map(person => (
              <li key={person.id} style={{ margin: '16px 0 0' }}>
                <Link to={`/characters/${person.id}`}>
                  {person.name}: {person.species}
                </Link>
              </li>
            ))
            .slice(0, 5)}
        </ul>
      </>
    )
  }

  let episodes
  if (episodeStatus === 'loading') {
    episodes = <p>Loading ...</p>
  } else if (episodeStatus === 'error') {
    episodes = <p>Error :(</p>
  } else if (episodeStatus === 'success' && episodeData) {
    episodes = (
      <>
        <h1>Episodes</h1>
        <ul>
          {episodeData.results
            .map(episode => (
              <li key={episode.id} style={{ margin: '16px 0 0' }}>
                <Link to={`/episodes/${episode.id}`}>
                  {episode.episode} - {episode.name} <em>{episode.airDate}</em>
                </Link>
              </li>
            ))
            .slice(0, 5)}
        </ul>
      </>
    )
  }

  return (
    <>
      <p>This is a server side rendering example for react-query.</p>
      {characters}
      {episodes}
    </>
  )
}

Home.prefetch = (queryCache, params) => {
  return Promise.all([
    queryCache.prefetchQuery('characters', fetchCharacters),
    queryCache.prefetchQuery('episodes', fetchEpisodes),
  ])
}

export default Home
