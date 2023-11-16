import * as React from 'react'
import { useQuery as useRenamedUseQuery } from '@tanstack/react-query'

export const WithObjectPattern = () => {
  const { isError, isLoading, isSuccess, status } = useRenamedUseQuery({
    queryKey: ['queryKey'],
    queryFn: () => ['data'],
  })

  if (isError || isLoading || isSuccess) {
    console.log('Do something')
  }

  return <div>{JSON.stringify({ isError, isLoading, isSuccess, status })}</div>
}

export const WithObjectPatternAndRename = () => {
  const { isError, isLoading: isLoadingRenamed, isSuccess, status } = useRenamedUseQuery({
    queryKey: ['queryKey'],
    queryFn: () => ['data'],
  })

  if (isError || isLoadingRenamed || isSuccess) {
    console.log('Do something')
  }

  return <div>{JSON.stringify({ isError, isLoadingRenamed, isSuccess, status })}</div>
}

export const WithObjectPatternAndRestElement = () => {
  const { isError, ...rest } = useRenamedUseQuery({
    queryKey: ['queryKey'],
    queryFn: () => ['data'],
  })

  if (isError || rest.isLoading || rest.isSuccess) {
    console.log('Do something')
  }

  return <div>{JSON.stringify({ isError, isLoading: rest.isLoading, isSuccess: rest.isSuccess })}</div>
}

export const WithIdentifier = () => {
  const queryResult = useRenamedUseQuery({
    queryKey: ['queryKey'],
    queryFn: () => ['data'],
  })

  if (queryResult.isError || queryResult.isLoading || queryResult.isSuccess) {
    console.log('Do something')
  }

  return <div>{JSON.stringify(queryResult)}</div>
}

export const WithCombinations = () => {
  function useSomethingElse() {
    const { isError, isLoading, isSuccess, status } = useRenamedUseQuery({
      queryKey: ['somethingElse'],
      queryFn: () => ['data'],
    })

    return { isError, isLoading, isSuccess, status }
  }

  function useAnotherThing() {
    const { isLoading, ...rest } = useRenamedUseQuery({
      queryKey: ['anotherThing'],
      queryFn: () => ['anotherData'],
    })

    return rest
  }

  const { isError, isLoading: isLoadingRenamed, isSuccess, status } = useRenamedUseQuery({
    queryKey: ['queryKey'],
    queryFn: () => ['data'],
  })

  return isLoadingRenamed
}
