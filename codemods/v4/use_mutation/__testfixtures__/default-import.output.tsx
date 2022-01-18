import * as React from 'react'
import { useMutation } from 'react-query'

export const Examples = () => {
  useMutation(['todos'])

  return <div>Example Component</div>
}
