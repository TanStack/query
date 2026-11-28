import { isFetching, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'
import { charactersQueries } from '../../services/characters/queries'

export default function CharacterPage() {
  const router = useRouter()
  const id = Number(router.query.id)
  const isValidId =
    typeof router.query.id === 'string' &&
    /^\d+$/.test(router.query.id) &&
    id > 0

  const queryResult = useQuery(
    charactersQueries.detail(isValidId ? id : undefined),
  )
  const { status, data, error } = queryResult
  const fetching = isFetching(queryResult)

  return (
    <div style={{ textAlign: 'center' }}>
      {router.isReady && !isValidId ? (
        'Invalid character ID'
      ) : status === 'pending' ? (
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
          <div>{fetching ? 'Background Updating...' : ' '}</div>
        </>
      )}
      <br />
      <br />
      <Link href="/">Back</Link>
    </div>
  )
}
