import * as React from 'react'
import { useQuery } from '@tanstack/react-query'

export const WithObjectPattern = () => {
  const { isError, isLoading, isSuccess, status } = useQuery({
    queryKey: ['queryKey'],
    queryFn: () => ['data'],
  })

  if (isError || isLoading || isSuccess) {
    console.log('Do something')
  }

  return <div>{JSON.stringify({ isError, isLoading, isSuccess, status })}</div>
}

export const WithObjectPatternAndRename = () => {
  const { isError, isLoading: isLoadingRenamed, isSuccess, status } = useQuery({
    queryKey: ['queryKey'],
    queryFn: () => ['data'],
  })

  if (isError || isLoadingRenamed || isSuccess) {
    console.log('Do something')
  }

  return <div>{JSON.stringify({ isError, isLoadingRenamed, isSuccess, status })}</div>
}

export const WithObjectPatternAndRestElement = () => {
  const { isError, ...rest } = useQuery({
    queryKey: ['queryKey'],
    queryFn: () => ['data'],
  })

  if (isError || rest.isLoading || rest.isSuccess) {
    console.log('Do something')
  }

  return <div>{JSON.stringify({ isError, isLoading: rest.isLoading, isSuccess: rest.isSuccess })}</div>
}

export const WithIdentifier = () => {
  const queryResult = useQuery({
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
    const { isError, isLoading, isSuccess, status } = useQuery({
      queryKey: ['somethingElse'],
      queryFn: () => ['data'],
    })

    return { isError, isLoading, isSuccess, status }
  }

  function useAnotherThing() {
    const { isLoading, ...rest } = useQuery({
      queryKey: ['anotherThing'],
      queryFn: () => ['anotherData'],
    })

    return { isLoading: rest.isLoading, ...rest }
  }

  const { isError, isLoading: isLoadingRenamed, isSuccess, status } = useQuery({
    queryKey: ['queryKey'],
    queryFn: () => ['data'],
  })

  return isLoadingRenamed
}
