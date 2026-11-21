import { Suspense } from 'preact/compat'
import ApproachTabs from './components/ApproachTabs'

export default function App() {
  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1>Optimistic Updates with TanStack Query</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Add todos to see optimistic updates in action. The server randomly fails
        ~30% of the time so you can observe automatic rollback.
      </p>
      <Suspense fallback={<p>Loading todos…</p>}>
        <ApproachTabs />
      </Suspense>
    </main>
  )
}
