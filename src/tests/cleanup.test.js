import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { cleanup } from '@testing-library/react/pure'
import { queryCache } from '..'
import { Page } from './cleanup'

describe('query cleanup', () => {
  afterEach(() => {
    queryCache.clear()
    // This will make things pass as it force-flushes the microtask queue twice
    // but it's a bandaid over an underlying issue
    // await cleanup()
  })

  test('should prefetchQuery by force for first query', async () => {
    await queryCache.prefetchQuery(
      ['user', 1],
      () => Promise.resolve({ userId: 1, username: 'Mock User' }),
      { force: true }
    )

    const { findByTestId, findByText } = render(<Page />)

    const showContent = await findByTestId('showContent')

    fireEvent.click(showContent)

    const userProfile = await findByText('User: Mock User')

    expect(userProfile).toBeDefined()
  })

  test('should prefetch by force for both queries', async () => {
    await queryCache.prefetchQuery(
      ['user', 1],
      () => Promise.resolve({ userId: 1, username: 'Mock User' }),
      { force: true }
    )
    await queryCache.prefetchQuery(
      ['posts', 1],
      () => Promise.resolve([{ postId: 1, body: 'World' }]),
      { force: true }
    )

    const { findByTestId, findByText } = render(<Page />)

    const showContent = await findByTestId('showContent')

    fireEvent.click(showContent)

    const userPosts = await findByText('Post: World')

    expect(userPosts).toBeDefined()
  })
})
