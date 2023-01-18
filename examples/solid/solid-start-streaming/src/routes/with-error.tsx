import { Title } from 'solid-start'
import { PostViewer } from '~/components/post-viewer'
import { UserInfo } from '~/components/user-info'

export default function Streamed() {
  return (
    <main>
      <Title>Solid Query - Streamed</Title>

      <h1>Solid Query - Streamed Example</h1>

      <div class="description">
        <p>
          HTML is streamed from the server ASAP, reducing key metrics such as
          TTFB and TTI. Suspended queries are streamed to the client when they
          resolve on the server. This is represented in your devtools by the
          green and blue chunks of the waterfall.
        </p>

        <p>
          Clients with javascript disabled will see the loading state for both
          queries. (try turning off javascript and reloading this page)
        </p>
      </div>

      <UserInfo sleep={10} deferStream simulateError />

      <PostViewer sleep={3000} deferStream simulateError />
    </main>
  )
}
