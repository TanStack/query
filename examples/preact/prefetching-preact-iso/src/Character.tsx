import { isFetching, useQuery } from '@tanstack/preact-query'
import { useRoute } from 'preact-iso'
import { charactersQueries } from './services/characters/queries'

export default function CharacterPage() {
  const { params } = useRoute()
  const id = Number(params.id)
  const isValidId = /^\d+$/.test(params.id) && id > 0

  const queryResult = useQuery(
    charactersQueries.detail(isValidId ? id : undefined),
  )

  return (
    <div style={{ textAlign: 'center' }}>
      {!isValidId ? (
        'Invalid character ID'
      ) : queryResult.status === 'pending' ? (
        'Loading...'
      ) : queryResult.status === 'error' ? (
        <span>Error: {queryResult.error.message}</span>
      ) : (
        <>
          <h1>{queryResult.data.name}</h1>
          <div>
            <p>status: {queryResult.data.status}</p>
            <p>species: {queryResult.data.species}</p>
            <p>gender: {queryResult.data.gender}</p>
            <p>origin: {queryResult.data.origin.name}</p>
          </div>
          <div>{isFetching(queryResult) ? 'Background Updating...' : ' '}</div>
        </>
      )}
      <br />
      <br />
      <a href="/">Back</a>
    </div>
  )
}
