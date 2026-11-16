import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { Toaster } from 'react-hot-toast'
import type { QueryClient } from '@tanstack/react-query'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  isRestoring: boolean
}>()({
  component: Root,
})

function Root() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  )
}
