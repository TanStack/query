import * as React from 'react'
import * as RQ from 'react-query'

export const Example = () => {
  // Instantiated hook call.
  const queries = RQ.useQueries({
    queries: [query1, query2]
  })
  // Direct hook call.
  RQ.useQueries({
    queries: [query1, query2]
  })

  return <div>Example Component</div>
}
