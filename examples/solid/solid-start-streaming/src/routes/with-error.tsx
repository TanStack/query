import { Title } from 'solid-start'
import { PostViewer } from '~/components/post-viewer'
import { UserInfo } from '~/components/user-info'

export default function Streamed() {
  return (
    <main>
      <Title>Solid Query - Errors</Title>

      <h1>Solid Query - Errors</h1>

      <div class="description">
        <p>
          For more control over error handling, try leveraging the `Switch`
          component and watching the reactive `query.isError` property. See
          `compoennts/query-boundary.tsx` for one possible approach.
        </p>
      </div>

      <UserInfo sleep={10} deferStream simulateError />

      <PostViewer sleep={3000} deferStream simulateError />
    </main>
  )
}
