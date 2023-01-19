import { createQuery } from '@tanstack/solid-query'
import type { Component } from 'solid-js'
import { Switch, Match } from 'solid-js'
import { createSignal } from 'solid-js'
import { Suspense } from 'solid-js'
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
      <Suspense fallback={<div class="loader">loading user...</div>}>
        <Switch>
          <Match when={query.isError}>
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
          </Match>

          <Match when={query.data}>
            <div>id: {query.data?.id}</div>
            <div>name: {query.data?.name}</div>
            <div>queryTime: {query.data?.queryTime}</div>
          </Match>
        </Switch>
      </Suspense>
    </Example>
  )
}
