import { Suspense } from 'preact/compat'
import { useSuspenseQuery } from '@tanstack/preact-query'
import ErrorBoundary from './ErrorBoundary'
import { waitQueries } from './services/wait/queries'

export const waits = [100, 200, 300, 400, 500, 600, 700]
export const combinedWaits = [800, 900, 1000]

function MyComponent(props: { wait: number }) {
  const { data } = useSuspenseQuery(waitQueries.detail(props.wait))

  return <div>result: {data}</div>
}

export default function App() {
  return (
    <>
      {waits.map((wait) => (
        <ErrorBoundary
          key={wait}
          fallback={(error) => <div>error: {error.message}</div>}
        >
          <Suspense fallback={<div>waiting {wait}....</div>}>
            <MyComponent wait={wait} />
          </Suspense>
        </ErrorBoundary>
      ))}

      <fieldset>
        <legend>
          combined <code>Suspense</code>-container
        </legend>
        <ErrorBoundary fallback={(error) => <div>error: {error.message}</div>}>
          <Suspense
            fallback={
              <>
                {combinedWaits.map((wait) => (
                  <div key={wait}>waiting {wait}....</div>
                ))}
              </>
            }
          >
            {combinedWaits.map((wait) => (
              <MyComponent key={wait} wait={wait} />
            ))}
          </Suspense>
        </ErrorBoundary>
      </fieldset>
    </>
  )
}
