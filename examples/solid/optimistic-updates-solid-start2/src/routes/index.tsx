import { ErrorBoundary, Suspense } from 'solid-js'
import ApproachTabs from '~/components/ApproachTabs'

export default function Home() {
  return (
    <main
      style={{ 'max-width': '600px', margin: '0 auto', padding: '2rem 1rem' }}
    >
      <h1>Optimistic Updates with TanStack Query</h1>
      <p style={{ color: '#666', 'margin-bottom': '1.5rem' }}>
        Add todos to see optimistic updates in action. The server randomly fails
        ~30% of the time so you can observe automatic rollback.
      </p>
      <ErrorBoundary
        fallback={(error) => <p style={{ color: 'red' }}>{error.message}</p>}
      >
        <Suspense fallback={<p>Loading todos…</p>}>
          <ApproachTabs />
        </Suspense>
      </ErrorBoundary>
    </main>
  )
}
