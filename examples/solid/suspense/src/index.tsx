/* @refresh reload */
import 'font-awesome/css/font-awesome.min.css'
import { ErrorBoundary, Show, Suspense, createSignal, lazy } from 'solid-js'
import { render } from 'solid-js/web'
import {
  QueryClient,
  QueryClientProvider,
  noop,
  useQueryClient,
} from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'

import { projectsQueries } from './services/projects/queries'

import Button from './components/Button'

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
  const [showProjects, setShowProjects] = createSignal(false)
  const [activeProject, setActiveProject] = createSignal<string | null>(null)

  return (
    <>
      <Button
        onClick={() => {
          if (!showProjects()) {
            queryClient.query(projectsQueries.list()).catch(noop)
          }
          setShowProjects((old) => !old)
        }}
      >
        {showProjects() ? 'Hide Projects' : 'Show Projects'}
      </Button>

      <hr />

      <ErrorBoundary
        fallback={(error: Error, reset) => (
          <div>
            There was an error!{' '}
            <Button onClick={() => reset()}>Try again</Button>
            <pre style={{ 'white-space': 'normal' }}>{error.message}</pre>
          </div>
        )}
      >
        <Show when={showProjects()}>
          <Suspense fallback={<h1>Loading projects...</h1>}>
            <Show
              when={activeProject()}
              fallback={<Projects setActiveProject={setActiveProject} />}
            >
              {(project) => (
                <Project
                  activeProject={project()}
                  setActiveProject={setActiveProject}
                />
              )}
            </Show>
          </Suspense>
        </Show>
      </ErrorBoundary>
      <SolidQueryDevtools initialIsOpen />
    </>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')
render(() => <App />, rootElement)
