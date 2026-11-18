import { Title } from '@solidjs/meta'
import { PostViewer } from '~/components/post-viewer'
import { UserInfo } from '~/components/user-info'

export default function Deferred() {
  return (
    <main>
      <Title>Solid Query - Deferred</Title>

      <h1>Solid Query - Deferred Example</h1>

      <div class="description">
        <p>
          Both queries are configured with deferStream=true, so the server will
          not start streaming HTML to the client until the queries have
          resolved. In this case we are not really taking advantage of streaming
          - this mimics traditional renderAsync + Suspense behavior. Note how
          the green bar in the devtools is much larger now - the client does not
          start receiving any information until 2+ seconds (both queries
          resolve).
        </p>

        <p>
          Clients with javascript disabled will see the resolved state for both
          queries. (try turning off javascript and reloading this page)
        </p>

        <img
          class="description_img"
          src="/imgs/deferred.png"
          alt="devtools deferred requests"
        />
      </div>

      <UserInfo sleep={2000} deferStream />

      <PostViewer sleep={2000} deferStream />
    </main>
  )
}
