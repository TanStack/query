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
  staleTime?: number
  gcTime?: number
}

export const userInfoQueryOpts = (props?: UserInfoProps) => ({
  queryKey: ['user'],
  queryFn: () => fetchUser(props),
  deferStream: props?.deferStream,
  staleTime: props?.staleTime,
  gcTime: props?.gcTime,
  throwOnError: true,
})

export const UserInfo: Component<UserInfoProps> = (props) => {
  const [simulateError, setSimulateError] = createSignal(props.simulateError)

  const query = createQuery(() =>
    userInfoQueryOpts({ ...props, simulateError: simulateError() }),
  )

  return (
    <Example
      title="User Query"
      deferStream={props.deferStream}
      sleep={props.sleep}
    >
      <QueryBoundary
        query={query}
        loadingFallback={<div class="loader">loading user...</div>}
        errorFallback={(err, retry) => (
          <div>
            <div class="error">{err.message}</div>
            <button
              onClick={() => {
                setSimulateError(false)
                retry()
              }}
            >
              retry
            </button>
          </div>
        )}
      >
        {(user) => (
          <>
            <div>id: {user.id}</div>
            <div>name: {user.name}</div>
            <div>queryTime: {user.queryTime}</div>
            <button
              onClick={() => {
                query.refetch()
              }}
            >
              refetch
            </button>
          </>
        )}
      </QueryBoundary>
    </Example>
  )
}
