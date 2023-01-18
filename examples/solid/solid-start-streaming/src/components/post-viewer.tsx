import { createQuery } from '@tanstack/solid-query'
import type { Component } from 'solid-js'
import { onCleanup, onMount, resetErrorBoundaries } from 'solid-js'
import { ErrorBoundary } from 'solid-start'
import { createSignal } from 'solid-js'
import { For, Suspense } from 'solid-js'
import { fetchPost } from '~/utils/api'
import { Example } from './example'

export interface PostViewerProps {
  deferStream?: boolean
  sleep?: number
  simulateError?: boolean
}

export const PostViewer: Component<PostViewerProps> = (props) => {
  const [simulateError, setSimulateError] = createSignal(props.simulateError)
  const [postId, setPostId] = createSignal(1)

  const query = createQuery(() => ({
    queryKey: ['posts', postId()],
    staleTime: 1000 * 10,
    queryFn: () =>
      fetchPost({
        postId: postId(),
        sleep: props.sleep,
        simulateError:
          simulateError() || (simulateError() !== false && postId() === 5),
      }),
    deferStream: props.deferStream,
  }))

  return (
    <Example
      title="Post Query"
      deferStream={props.deferStream}
      sleep={props.sleep}
    >
      <div style={{ 'margin-top': '20px' }}>
        <button
          onClick={() => {
            setPostId(Math.max(postId() - 1, 1))
            resetErrorBoundaries()
          }}
        >
          Previous Post
        </button>
        <button
          onClick={() => {
            setPostId(Math.min(postId() + 1, 100))
            resetErrorBoundaries()
          }}
        >
          Next Post
        </button>
      </div>

      <ErrorBoundary
        fallback={(err, resetErrorBoundary) => {
          return (
            <div>
              <div class="error">{err.message}</div>
              <button
                onClick={() => {
                  setSimulateError(false)
                  resetErrorBoundary()
                  query.refetch()
                }}
              >
                retry
              </button>
            </div>
          )
        }}
      >
        <Suspense fallback={<div class="loader">loading post...</div>}>
          <For each={query.data}>
            {(post) => (
              <div style={{ 'margin-top': '20px' }}>
                <b>
                  [post {postId()}] {post.title}
                </b>
                <p>{post.body}</p>
              </div>
            )}
          </For>
        </Suspense>
      </ErrorBoundary>
    </Example>
  )
}
