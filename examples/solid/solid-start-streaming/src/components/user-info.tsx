import { createQuery } from '@tanstack/solid-query'
import type { Component } from 'solid-js'
import { createSignal } from 'solid-js'
import { fetchUser } from '~/utils/api'
import { Example } from './example'
import { QueryBoundary } from './query-boundary'

export interface UserInfoProps {
  deferStream?: boolean
  sleep?: number
  simulateError?: boolean
}

export const UserInfo: Component<UserInfoProps> = (props) => {
  const [simulateError, setSimulateError] = createSignal(props.simulateError)

  const query = createQuery(() => ({
    queryKey: ['user'],
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
      <QueryBoundary
        query={query}
        loadingFallback={<div class="loader">loading user...</div>}
        errorFallback={
          <div>
            <div class="error">{query.error?.message}</div>
            <button
              onClick={() => {
                setSimulateError(false)
                query.refetch()
              }}
            >
              retry
            </button>
          </div>
        }
      >
        {(user) => (
          <>
            <div>id: {user.id}</div>
            <div>name: {user.name}</div>
            <div>queryTime: {user.queryTime}</div>
          </>
        )}
      </QueryBoundary>
    </Example>
  )
}
