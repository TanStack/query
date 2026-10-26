import 'font-awesome/css/font-awesome.min.css'
import { render } from 'preact'
import { Suspense, lazy } from 'preact/compat'
import { useState } from 'preact/hooks'
import {
  QueryClient,
  QueryClientProvider,
  QueryErrorResetBoundary,
  noop,
  useQueryClient,
} from '@tanstack/preact-query'
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'

import { projectsQueries } from './services/projects/queries'

import Button from './components/Button'
import ErrorBoundary from './components/ErrorBoundary'

const Projects = lazy(() => import('./components/Projects'))
const Project = lazy(() => import('./components/Project'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
    </QueryClientProvider>
  )
}

function Example() {
  const queryClient = useQueryClient()
  const [showProjects, setShowProjects] = useState(false)
  const [activeProject, setActiveProject] = useState<string | null>(null)

  return (
    <>
      <Button
        onClick={() => {
          if (!showProjects) {
            queryClient.query(projectsQueries.list()).catch(noop)
          }
          setShowProjects((old) => !old)
        }}
      >
        {showProjects ? 'Hide Projects' : 'Show Projects'}
      </Button>

      <hr />

      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            fallbackRender={({ error, resetErrorBoundary }) => (
              <div>
                There was an error!{' '}
                <Button onClick={() => resetErrorBoundary()}>Try again</Button>
                <pre style={{ whiteSpace: 'normal' }}>{error.message}</pre>
              </div>
            )}
            onReset={reset}
          >
            {showProjects ? (
              <Suspense fallback={<h1>Loading projects...</h1>}>
                {activeProject ? (
                  <Project
                    activeProject={activeProject}
                    setActiveProject={setActiveProject}
                  />
                ) : (
                  <Projects setActiveProject={setActiveProject} />
                )}
              </Suspense>
            ) : null}
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
      <PreactQueryDevtools initialIsOpen />
    </>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')
render(<App />, rootElement)
