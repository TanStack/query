import React from 'react'
import Button from '../components/button'
import fetch from '../libs/fetch'
import { login, logout } from '../libs/auth'

import { useQuery, useMutation } from 'react-query'

export default () => {
  const { status, data, error } = useQuery('user', () => fetch('/api/user'))

  const [logoutMutation] = useMutation(logout, {
    refetchQueries: ['user'],
  })

  const [loginMutation] = useMutation(login, {
    refetchQueries: ['user'],
  })

  if (status === 'loading') return <h1>Loading...</h1>
  if (status === 'error') return <span>Error: {error.message}</span>
  if (data.loggedIn) {
    return (
      <div>
        <h1>Welcome, {data.name}</h1>
        <img src={data.avatar} width={80} />
        <Button
          onClick={() => {
            logoutMutation()
          }}
        >
          Logout
        </Button>
      </div>
    )
  } else {
    return (
      <div>
        <h1>Please login</h1>
        <Button
          onClick={() => {
            loginMutation()
          }}
        >
          Login
        </Button>
      </div>
    )
  }
}
