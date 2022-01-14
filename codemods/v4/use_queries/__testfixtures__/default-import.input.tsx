import * as React from 'react'
import { useQueries } from 'react-query'

export const Example = () => {
  // Instantiated hook call.
  const queries = useQueries([query1, query2])
  // Direct hook call.
  useQueries([query1, query2])

  return <div>Example Component</div>
}
