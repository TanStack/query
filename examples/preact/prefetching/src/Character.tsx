import { useRoute } from 'preact-iso'
import { useQuery } from '@tanstack/preact-query'
import { charactersQueries } from './services/characters/queries'

export default function CharacterPage() {
  const id = Number(useRoute().params.id)

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
      <a href="/">Back</a>
    </div>
  )
}
