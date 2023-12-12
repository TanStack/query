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
import { DehydrateRouter } from '@tanstack/react-router-server/client'

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
  console.log('dehydrateddata', router.dehydratedData)
  router // TODO: can we change type in TSR so we can return ReactNode instead of just string?
    .injectHtml(cb as any)
}

const rootRoute = rootRouteWithContext<{
  head: string
}>()({
  component: RootComponent,
})
function RootComponent() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000,
          },
        },
      }),
  )

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Vite App</title>
        <script
          type="module"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              import RefreshRuntime from "/@react-refresh"
              RefreshRuntime.injectIntoGlobalHook(window)
              window.$RefreshReg$ = () => {}
              window.$RefreshSig$ = () => (type) => type
              window.__vite_plugin_react_preamble_installed__ = true
            `,
          }}
        />
        <script type="module" src="/@vite/client" />
        <script type="module" src="/src/entry-client.tsx" />
      </head>
      <body>
        <h1>TSR + TSQ Automatic Streaming Hydration</h1>
        <QueryClientProvider client={queryClient}>
          <ReactQueryStreamedHydration useInjectServerHTML={useInjectHTML}>
            <Suspense fallback={'Global suspense boundary yeyo'}>
              <Outlet />
            </Suspense>
          </ReactQueryStreamedHydration>
          <ReactQueryDevtools />
        </QueryClientProvider>
        <DehydrateRouter />
      </body>
    </html>
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
    context: {
      head: '',
    },
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
