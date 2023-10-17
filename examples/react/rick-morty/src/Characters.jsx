import React from 'react'
import { Typography, Link } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import fetch from './fetch'

export default function Characters() {
  const { status, data } = useQuery({
    queryKey: ['characters'],
    queryFn: () => fetch('https://rickandmortyapi.com/api/character/'),
  })

  if (status === 'pending') return <p>Loading...</p>
  if (status === 'error') return <p>Error :(</p>

  console.info(data)

  return (
    <div>
      <Typography variant="h2">Characters</Typography>
      {data.results.map((person) => {
        return (
          <article key={person.id} style={{ margin: '16px 0 0' }}>
            <Link component={RouterLink} to={`/characters/${person.id}`}>
              <Typography variant="h6">
                {person.name} - {person.gender}: {person.species}
              </Typography>
            </Link>
          </article>
        )
      })}
    </div>
  )
}
