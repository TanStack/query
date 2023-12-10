import {
  QueryClient,
  QueryClientProvider,
  useSuspenseQuery,
} from '@tanstack/react-query'
import {
  Outlet,
  Route,
  Router,
  rootRouteWithContext,
  useRouter,
} from '@tanstack/react-router'
import { Suspense, useState } from 'react'

import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

function WaitComponent(props: { wait: number }) {
  const { data } = useSuspenseQuery({
    queryKey: ['wait', props.wait],
    queryFn: async () => {
      const path = `/api/wait?wait=${props.wait}`
      const url = 'http://localhost:3000' + path

      console.log('fetching', url)
      const res = (await (await fetch(url)).json()) as string
      return res
    },
  })

  return <div>result: {data}</div>
}

function useInjectHTML(cb: () => React.ReactNode) {
  const router = useRouter()
  // TODO: can we change type in TSR so we can return ReactNode instead of just string?
  router.injectHtml(cb as any)
}

const rootRoute = rootRouteWithContext()({
  component: RootComponent,
})
function RootComponent() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
          },
        },
      }),
  )

  return (
    <div>
      <h1>TSR + TSQ Automatic Streaming Hydration</h1>
      <Suspense fallback={'Global suspense boundary yeyo'}>
        <QueryClientProvider client={queryClient}>
          <ReactQueryStreamedHydration useInjectServerHTML={useInjectHTML}>
            <Outlet />
          </ReactQueryStreamedHydration>
          <ReactQueryDevtools buttonPosition="top-right" />
          <TanStackRouterDevtools position="bottom-right" />
        </QueryClientProvider>
      </Suspense>
    </div>
  )
}

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexRouteComponent,
})
function IndexRouteComponent() {
  return (
    <>
      <Suspense fallback={<div>waiting 100....</div>}>
        <WaitComponent wait={100} />
      </Suspense>
      <Suspense fallback={<div>waiting 200....</div>}>
        <WaitComponent wait={200} />
      </Suspense>
      <Suspense fallback={<div>waiting 300....</div>}>
        <WaitComponent wait={300} />
      </Suspense>
      <Suspense fallback={<div>waiting 400....</div>}>
        <WaitComponent wait={400} />
      </Suspense>
      <Suspense fallback={<div>waiting 500....</div>}>
        <WaitComponent wait={500} />
      </Suspense>
      <Suspense fallback={<div>waiting 600....</div>}>
        <WaitComponent wait={600} />
      </Suspense>
      <Suspense fallback={<div>waiting 700....</div>}>
        <WaitComponent wait={700} />
      </Suspense>

      <fieldset>
        <legend>
          combined <code>Suspense</code>-container
        </legend>
        <Suspense
          fallback={
            <>
              <div>waiting 800....</div>
              <div>waiting 900....</div>
              <div>waiting 1000....</div>
            </>
          }
        >
          <WaitComponent wait={800} />
          <WaitComponent wait={900} />
          <WaitComponent wait={1000} />
        </Suspense>
      </fieldset>
    </>
  )
}

export function createRouter() {
  return new Router({
    routeTree: rootRoute.addChildren([indexRoute]),
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
