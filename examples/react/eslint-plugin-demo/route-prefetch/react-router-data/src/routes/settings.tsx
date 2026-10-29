import { useParams } from 'react-router-dom'
import { useSuspenseQuery } from '@tanstack/react-query'
import { settingsOptions, userOptions } from '../queries'
import type { LoaderFunctionArgs } from 'react-router-dom'
import type { QueryClient } from '@tanstack/react-query'

// Prefetches the user, but `Settings` renders the user's settings.
export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    await queryClient.ensureQueryData(userOptions(params.userId))
    return null
  }

export function Settings() {
  const { userId } = useParams()
  const { data: settings } = useSuspenseQuery(settingsOptions(userId))

  return <p>Theme: {settings.theme}</p>
}
