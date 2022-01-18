import * as React from 'react'
import * as RQ from 'react-query'

export const Examples = () => {
  RQ.useMutation(['todos'])

  return <div>Example Component</div>
}
