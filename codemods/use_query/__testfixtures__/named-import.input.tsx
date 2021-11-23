import * as React from 'react'
import { useQuery as useRenamedQuery } from 'react-query'

export const Example = () => {
  const { data } = useRenamedQuery('repoData', () =>
    fetch('https://api.github.com/repos/tannerlinsley/react-query').then(res =>
      res.json()
    )
  )

  return <div>{JSON.stringify(data)}</div>
}
