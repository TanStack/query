import { Title } from '@solidjs/meta'
import { PostViewer } from '~/components/post-viewer'
import { UserInfo } from '~/components/user-info'

export default function Mixed() {
  return (
    <main>
      <Title>Solid Query - Mixed</Title>

      <h1>Solid Query - Mixed Example</h1>

      <div class="description">
        <p>
          You may want to require that key queries resolve before the initial
          HTML is streamed to the client, while allowing the rest of your
          queries to stream to the client as they resolve. A common use case for
          this is to populate SEO meta tags and/or social graph information for
          unfurl scenarios such as sharing the page as a link in Slack.
        </p>

        <p>
          In this example, the quick (100ms) user query has deferStream set to
          true, while the more expensive post query (1000ms) is streamed to the
          client when ready. Clients with javascript disabled will see the
          resolved state for the user query, and the loading state for the post
          query. (try turning off javascript and reloading this page)
        </p>
      </div>

      <UserInfo deferStream sleep={100} />

      <PostViewer sleep={1000} />
    </main>
  )
}
