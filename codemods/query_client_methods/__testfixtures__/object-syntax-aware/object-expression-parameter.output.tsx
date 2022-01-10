import * as React from 'react'
import { useQueryClient } from 'react-query'

const options = {}

export const ExamplesWithCancelQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({
    queryKey: ['todos']
  })
  queryClient.cancelQueries({
    queryKey: ['todos'],
    exact: true
  })
  queryClient.cancelQueries({
    queryKey: ['todos'],
    exact: true
  }, options)
  queryClient.cancelQueries({
    queryKey: ['todos']
  })
  queryClient.cancelQueries({
    queryKey: ['todos'],
    exact: true
  })
  queryClient.cancelQueries({
    queryKey: ['todos'],
    exact: true
  }, options)
  // Direct hook call.
  useQueryClient().cancelQueries({
    queryKey: ['todos']
  })
  useQueryClient().cancelQueries({
    queryKey: ['todos'],
    exact: true
  })
  useQueryClient().cancelQueries({
    queryKey: ['todos'],
    exact: true
  }, options)
  useQueryClient().cancelQueries({
    queryKey: ['todos']
  })
  useQueryClient().cancelQueries({
    queryKey: ['todos'],
    exact: true
  })
  useQueryClient().cancelQueries({
    queryKey: ['todos'],
    exact: true
  }, options)

  return <div>Example Component</div>
}

export const ExamplesWithInvalidateQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.invalidateQueries({
    queryKey: ['todos']
  })
  queryClient.invalidateQueries({
    queryKey: ['todos'],
    exact: true
  })
  queryClient.invalidateQueries({
    queryKey: ['todos'],
    exact: true
  }, options)
  queryClient.invalidateQueries({
    queryKey: ['todos']
  })
  queryClient.invalidateQueries({
    queryKey: ['todos'],
    exact: true
  })
  queryClient.invalidateQueries({
    queryKey: ['todos'],
    exact: true
  }, options)
  // Direct hook call.
  useQueryClient().invalidateQueries({
    queryKey: ['todos']
  })
  useQueryClient().invalidateQueries({
    queryKey: ['todos'],
    exact: true
  })
  useQueryClient().invalidateQueries({
    queryKey: ['todos'],
    exact: true
  }, options)
  useQueryClient().invalidateQueries({
    queryKey: ['todos']
  })
  useQueryClient().invalidateQueries({
    queryKey: ['todos'],
    exact: true
  })
  useQueryClient().invalidateQueries({
    queryKey: ['todos'],
    exact: true
  }, options)

  return <div>Example Component</div>
}

export const ExamplesWithRefetchQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.refetchQueries({
    queryKey: ['todos']
  })
  queryClient.refetchQueries({
    queryKey: ['todos'],
    exact: true
  })
  queryClient.refetchQueries({
    queryKey: ['todos'],
    exact: true
  }, options)
  queryClient.refetchQueries({
    queryKey: ['todos']
  })
  queryClient.refetchQueries({
    queryKey: ['todos'],
    exact: true
  })
  queryClient.refetchQueries({
    queryKey: ['todos'],
    exact: true
  }, options)
  // Direct hook call.
  useQueryClient().refetchQueries({
    queryKey: ['todos']
  })
  useQueryClient().refetchQueries({
    queryKey: ['todos'],
    exact: true
  })
  useQueryClient().refetchQueries({
    queryKey: ['todos'],
    exact: true
  }, options)
  useQueryClient().refetchQueries({
    queryKey: ['todos']
  })
  useQueryClient().refetchQueries({
    queryKey: ['todos'],
    exact: true
  })
  useQueryClient().refetchQueries({
    queryKey: ['todos'],
    exact: true
  }, options)

  return <div>Example Component</div>
}

export const ExamplesWithRemoveQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.removeQueries({
    queryKey: ['todos']
  })
  queryClient.removeQueries({
    queryKey: ['todos'],
    exact: true
  })
  queryClient.removeQueries({
    queryKey: ['todos']
  })
  queryClient.removeQueries({
    queryKey: ['todos'],
    exact: true
  })
  // Direct hook call.
  useQueryClient().removeQueries({
    queryKey: ['todos']
  })
  useQueryClient().removeQueries({
    queryKey: ['todos'],
    exact: true
  })
  useQueryClient().removeQueries({
    queryKey: ['todos']
  })
  useQueryClient().removeQueries({
    queryKey: ['todos'],
    exact: true
  })

  return <div>Example Component</div>
}

export const ExamplesWithResetQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.resetQueries({
    queryKey: ['todos']
  })
  queryClient.resetQueries({
    queryKey: ['todos'],
    exact: true
  })
  queryClient.resetQueries({
    queryKey: ['todos'],
    exact: true
  }, options)
  queryClient.resetQueries({
    queryKey: ['todos']
  })
  queryClient.resetQueries({
    queryKey: ['todos'],
    exact: true
  })
  queryClient.resetQueries({
    queryKey: ['todos'],
    exact: true
  }, options)
  // Direct hook call.
  useQueryClient().resetQueries({
    queryKey: ['todos']
  })
  useQueryClient().resetQueries({
    queryKey: ['todos'],
    exact: true
  })
  useQueryClient().resetQueries({
    queryKey: ['todos'],
    exact: true
  }, options)
  useQueryClient().resetQueries({
    queryKey: ['todos']
  })
  useQueryClient().resetQueries({
    queryKey: ['todos'],
    exact: true
  })
  useQueryClient().resetQueries({
    queryKey: ['todos'],
    exact: true
  }, options)

  return <div>Example Component</div>
}
