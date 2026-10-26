import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'
import { charactersQueries } from '../../services/characters/queries'

export default function CharacterPage() {
  const router = useRouter()
  const id =
    typeof router.query.id === 'string' ? Number(router.query.id) : undefined

  const { status, data, error, isFetching } = useQuery(
    charactersQueries.detail(id),
  )

  return (
    <div style={{ textAlign: 'center' }}>
      {status === 'pending' ? (
        'Loading...'
      ) : status === 'error' ? (
        <span>Error: {error.message}</span>
      ) : (
        <>
          <h1>{data.name}</h1>
          <div>
            <p>status: {data.status}</p>
            <p>species: {data.species}</p>
            <p>gender: {data.gender}</p>
            <p>origin: {data.origin.name}</p>
          </div>
          <div>{isFetching ? 'Background Updating...' : ' '}</div>
        </>
      )}
      <br />
      <br />
      <Link href="/">Back</Link>
    </div>
  )
}
