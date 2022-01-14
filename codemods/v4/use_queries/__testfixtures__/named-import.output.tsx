import * as React from 'react'
import { useQueries as useRenamedQueries } from 'react-query'

export const Example = () => {
  // Instantiated hook call.
  const queries = useRenamedQueries({
    queries: [query1, query2]
  })
  // Direct hook call.
  useRenamedQueries({
    queries: [query1, query2]
  })

  return <div>Example Component</div>
}
