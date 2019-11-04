import React from 'react'
import fetch from '../libs/fetch'

import { useQuery, useMutation, setQueryData } from 'react-query'

export default () => {
  const [text, setText] = React.useState('')
  const { data, isLoading, isFetching } = useQuery('todos', () =>
    fetch('/api/data')
  )

  const [mutatePostTodo] = useMutation(
    text =>
      fetch('/api/data', {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    {
      refetchQueries: ['todos'],
      // to revalidate the data and ensure the UI doesn't
      // remain in an incorrect state, ALWAYS trigger a
      // a refetch of the data, even on failure
      refetchQueriesOnFailure: true,
    }
  )

  async function handleSubmit(event) {
    event.preventDefault()
    // mutate current data to optimistically update the UI
    // the fetch below could fail, so we need to revalidate
    // regardless

    setQueryData('todos', [...data, text], {
      shouldRefetch: false,
    })

    try {
      // send text to the API
      await mutatePostTodo(text)
      setText('')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          onChange={event => setText(event.target.value)}
          value={text}
        />
        <button>Create</button>
      </form>
      <ul>
        {isLoading ? (
          'Loading...'
        ) : (
          <>
            {data ? data.map(datum => <li key={datum}>{datum}</li>) : null}
            <div>{isFetching ? 'Updating in background...' : ' '}</div>
          </>
        )}
      </ul>
    </div>
  )
}
