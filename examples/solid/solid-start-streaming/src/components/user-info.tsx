import { createQuery } from '@tanstack/solid-query'
import type { Component } from 'solid-js'
import { createSignal } from 'solid-js'
import { Suspense } from 'solid-js'
import { ErrorBoundary } from 'solid-start'
import { fetchUser } from '~/utils/api'
import { Example } from './example'

export interface UserInfoProps {
  deferStream?: boolean
  sleep?: number
  simulateError?: boolean
}

export const UserInfo: Component<UserInfoProps> = (props) => {
  const [simulateError, setSimulateError] = createSignal(props.simulateError)

  const query = createQuery(() => ({
    queryKey: ['user'],
    staleTime: 1000 * 10,
    queryFn: () =>
      fetchUser({ sleep: props.sleep, simulateError: simulateError() }),
    deferStream: props.deferStream,
  }))

  return (
    <Example
      title="User Query"
      deferStream={props.deferStream}
      sleep={props.sleep}
    >
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
        <Suspense fallback={<div class="loader">loading user...</div>}>
          <div>id: {query.data?.id}</div>
          <div>name: {query.data?.name}</div>
          <div>queryTime: {query.data?.queryTime}</div>
        </Suspense>
      </ErrorBoundary>
    </Example>
  )
}
