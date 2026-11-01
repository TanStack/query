import { ErrorBoundary, Show, Suspense } from 'solid-js'
import { A, useParams } from '@solidjs/router'
import { useQuery } from '@tanstack/solid-query'
import { charactersQueries } from '~/services/characters/queries'

export default function CharacterPage() {
  const params = useParams<{ id: string }>()
  const id = () => Number(params.id)
  const isValidId = () => /^\d+$/.test(params.id) && id() > 0

  const characterQuery = useQuery(() => ({
    ...charactersQueries.detail(isValidId() ? id() : undefined),
    throwOnError: true,
  }))

  return (
    <div style={{ 'text-align': 'center' }}>
      <Show when={isValidId()} fallback="Invalid character ID">
        <ErrorBoundary
          fallback={(error) => <span>Error: {error.message}</span>}
        >
          <Suspense fallback="Loading...">
            <h1>{characterQuery.data?.name}</h1>
            <div>
              <p>status: {characterQuery.data?.status}</p>
              <p>species: {characterQuery.data?.species}</p>
              <p>gender: {characterQuery.data?.gender}</p>
              <p>origin: {characterQuery.data?.origin.name}</p>
            </div>
            <div>
              {characterQuery.isFetching ? 'Background Updating...' : ' '}
            </div>
          </Suspense>
        </ErrorBoundary>
      </Show>
      <br />
      <br />
      <A href="/">Back</A>
    </div>
  )
}
