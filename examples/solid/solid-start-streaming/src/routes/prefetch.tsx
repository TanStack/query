import { useQueryClient } from '@tanstack/solid-query'
import { isServer } from 'solid-js/web'
import { Title } from 'solid-start'
import { UserInfo, userInfoQueryOpts } from '~/components/user-info'

export default function Prefetch() {
  const queryClient = useQueryClient()

  if (isServer) {
    void queryClient.prefetchQuery(userInfoQueryOpts({ sleep: 500 }))
  }

  return (
    <main>
      <Title>Solid Query - Prefetch</Title>

      <h1>Solid Query - Prefetch Example</h1>

      <div class="description">
        <p>
          In some cases you may want to prefetch a query on the server before
          the component with the relevant `createQuery` call is mounted. A major
          use case for this is in router data loaders, in order to avoid request
          waterfalls.
        </p>
        <p>
          In this example we prefetch the user query (on the server only). There
          should be no extra `fetchUser.start` and `fetchUser.done` logs in the
          console on the client when refreshing the page.
        </p>
      </div>

      <UserInfo sleep={500} deferStream />
    </main>
  )
}
