import { useQueryClient } from '@tanstack/solid-query'
import { isServer } from 'solid-js/web'
import { Title } from '@solidjs/meta'
import type { RoutePreloadFuncArgs } from '@solidjs/router'
import { UserInfo, userInfoQueryOpts } from '~/components/user-info'

export const route = {
  load: ({ intent }: RoutePreloadFuncArgs) => {
    // The router re-runs `load` on the client during hydration, with the
    // same `intent: "initial"` the server call gets. UserInfo's useQuery
    // already hydrates that data on the client through its own resource,
    // so prefetching again here just duplicates the fetch. Hover preload
    // (`intent: "preload"`) and real navigation (`intent: "navigate"`)
    // still need to run, since neither has server-rendered data to use.
    if (isServer || intent !== 'initial') {
      const queryClient = useQueryClient()
      // Prefetching the user info and caching it for 15 seconds.
      queryClient.prefetchQuery(
        userInfoQueryOpts({ sleep: 500, gcTime: 15000 }),
      )
    }
  },
}

export default function Prefetch() {
  return (
    <main>
      <Title>Solid Query - Prefetch</Title>

      <h1>Solid Query - Prefetch Example</h1>

      <div class="description">
        <p>
          SolidStart now supports link prefetching. This means that when a user
          hovers over a link, the browser can prefetch the data for that page
          before the user even clicks on the link. This can make navigating
          around your app feel much faster.
        </p>
        <p>
          To see this in action, go to the home page and reload the page. Then
          hover over the "Prefetch" link in the navigation. You should see the
          user data prefetch in the background and in the devtools. When you
          click on the link, the page should load instantly.
        </p>
      </div>

      <UserInfo sleep={500} />
    </main>
  )
}
