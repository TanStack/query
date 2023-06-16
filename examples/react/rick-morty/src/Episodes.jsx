import React from 'react'
import { Typography, Link } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import fetch from './fetch'

export default function Episodes() {
  const { data, status } = useQuery({
    queryKey: ['episodes'],
    queryFn: () => fetch('https://rickandmortyapi.com/api/episode'),
  })

  if (status === 'pending') {
    return <p>Loading...</p>
  }
  if (status === 'error') {
    return <p>Error :(</p>
  }

  return (
    <div>
      <Typography variant="h2">Episodes</Typography>
      {data.results.map((episode) => (
        <article key={episode.id}>
          <Link component={RouterLink} to={`/episodes/${episode.id}`}>
            <Typography variant="h6">
              {episode.episode} - {episode.name} <em>{episode.airDate}</em>
            </Typography>
          </Link>
        </article>
      ))}
    </div>
  )
}
