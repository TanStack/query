import * as React from 'react'
import { useMutation as useRenamedMutation } from 'react-query'

export const Examples = () => {
  useRenamedMutation('todos')

  return <div>Example Component</div>
}
