import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'

type Profile = {
  isDefault: boolean
  profileId: string
}

const profilesQueryOptions = queryOptions({
  queryKey: ['profiles'],
  queryFn: async (): Promise<Array<Profile>> => {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return [
      { profileId: 'default-profile', isDefault: true },
      { profileId: 'secondary-profile', isDefault: false },
    ]
  },
  retry: false,
})

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <main>
      <h1>Profiles</h1>
      <React.Suspense fallback={<p data-testid="loading">loading</p>}>
        <ActiveProfile />
      </React.Suspense>
    </main>
  )
}

function ActiveProfile() {
  const profiles = useSuspenseQuery(profilesQueryOptions).data
  const activeProfile = profiles.find((profile) => profile.isDefault)

  return (
    <p data-testid="active-profile">{activeProfile?.profileId ?? 'missing'}</p>
  )
}
