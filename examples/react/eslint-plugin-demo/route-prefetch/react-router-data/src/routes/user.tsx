import { useLoaderData } from 'react-router-dom'
import { useSuspenseQuery } from '@tanstack/react-query'
import { userOptions } from '../queries'
import type { LoaderFunctionArgs } from 'react-router-dom'
import type { QueryClient } from '@tanstack/react-query'

export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    void queryClient.prefetchQuery(userOptions(params.userId))
    return { userId: params.userId }
  }

export function User() {
  const { userId } =
    useLoaderData<Awaited<ReturnType<ReturnType<typeof loader>>>>()
  const { data: user } = useSuspenseQuery(userOptions(userId))

  return <h1>{user.name}</h1>
}
