import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { queryCache } from '..'
import { Page } from './cleanup'

describe('query cleanup', () => {
  afterEach(() => {
    queryCache.clear()
  })

  test('should set query data on first test', async () => {
    queryCache.setQueryData(['user', 1], { userId: 1, username: 'Mock User' })

    const { findByTestId, findByText } = render(<Page />)

    const showContent = await findByTestId('showContent')

    fireEvent.click(showContent)

    const userProfile = await findByText('User: Mock User')

    expect(userProfile).toBeDefined()
  })

  test('should not garbage collect new initial data', async () => {
    queryCache.setQueryData(['user', 1], { userId: 1, username: 'Mock 2 User' })
    queryCache.setQueryData(['posts', 1], [{ postId: 1, body: 'World' }])

    const { findByTestId, findByText } = render(<Page />)

    const showContent = await findByTestId('showContent')

    fireEvent.click(showContent)

    const userPosts = await findByText('Post: World')

    expect(userPosts).toBeDefined()
  })
})
