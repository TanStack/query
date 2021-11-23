import * as React from 'react'
import { useQuery as useRenamedQuery } from 'react-query'

const Example = () => {
  const { data } = useRenamedQuery({
    queryKey: 'repoData',

    queryFn: () =>
      fetch('https://api.github.com/repos/tannerlinsley/react-query').then(res =>
        res.json()
      )
  })

  return <div>{JSON.stringify(data)}</div>
}
