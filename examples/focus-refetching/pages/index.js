import React from 'react'
import axios from 'axios'

import {
  useQuery,
  useEnvironment,
  useMutation,
  MutationCache,
  QueryCache,
  Environment,
  EnvironmentProvider,
  invalidateQueries,
} from 'react-query'
import { ReactQueryDevtools } from 'react-query-devtools'

const environment = new Environment({
  queryCache: new QueryCache(),
  mutationCache: new MutationCache(),
})

export default function App() {
  return (
    <EnvironmentProvider environment={environment}>
      <Example />
    </EnvironmentProvider>
  )
}

function Example() {
  const environment = useEnvironment()

  const { status, data, error } = useQuery('user', async () => {
    const res = await axios.get('/api/user')
    return res.data
  })

  const logoutMutation = useMutation(logout, {
    onSuccess: () => invalidateQueries(environment, 'user'),
  })

  const loginMutation = useMutation(login, {
    onSuccess: () => invalidateQueries(environment, 'user'),
  })

  return (
    <div>
      <p>
        In this example, you should open two tabs, log in or out on one tab,
        then focus the other to see it sync up! (Pro Tip: Do NOT use incognito
        tabs)
      </p>
      {status === 'loading' ? (
        <h1>Loading...</h1>
      ) : status === 'error' ? (
        <span>Error: {error.message}</span>
      ) : data.loggedIn ? (
        <div>
          <h1>Welcome, {data.name}</h1>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img src={data.avatar} width={80} />
          <div>
            <button
              onClick={() => {
                logoutMutation.mutate()
              }}
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h1>Please login</h1>
          <div>
            <button
              onClick={() => {
                loginMutation.mutate()
              }}
            >
              Login
            </button>
          </div>
        </div>
      )}
      <ReactQueryDevtools initialIsOpen />
    </div>
  )
}

function login() {
  document.cookie = 'swr-test-token=swr;'
}

function logout() {
  document.cookie = 'swr-test-token=; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
}
