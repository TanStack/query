import * as React from 'react'
import { useQuery as useRenamedUseQuery } from '@tanstack/react-query'

export const WithObjectPattern = () => {
  const { isError, isPending, isSuccess, status } = useRenamedUseQuery({
    queryKey: ['queryKey'],
    queryFn: () => ['data'],
  })

  if (isError || isPending || isSuccess) {
    console.log('Do something')
  }

  return <div>{JSON.stringify({ isError, isPending, isSuccess, status })}</div>;
}

export const WithObjectPatternAndRename = () => {
  const { isError, isPending: isLoadingRenamed, isSuccess, status } = useRenamedUseQuery({
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

  if (isError || rest.isPending || rest.isSuccess) {
    console.log('Do something')
  }

  return <div>{JSON.stringify({ isError, isLoading: rest.isPending, isSuccess: rest.isSuccess })}</div>;
}

export const WithIdentifier = () => {
  const queryResult = useRenamedUseQuery({
    queryKey: ['queryKey'],
    queryFn: () => ['data'],
  })

  if (queryResult.isError || queryResult.isPending || queryResult.isSuccess) {
    console.log('Do something')
  }

  return <div>{JSON.stringify(queryResult)}</div>
}

export const WithCombinations = () => {
  function useSomethingElse() {
    const { isError, isPending, isSuccess, status } = useRenamedUseQuery({
      queryKey: ['somethingElse'],
      queryFn: () => ['data'],
    })

    return { isError, isPending, isSuccess, status };
  }

  function useAnotherThing() {
    const { isPending, ...rest } = useRenamedUseQuery({
      queryKey: ['anotherThing'],
      queryFn: () => ['anotherData'],
    })

    return rest
  }

  const { isError, isPending: isLoadingRenamed, isSuccess, status } = useRenamedUseQuery({
    queryKey: ['queryKey'],
    queryFn: () => ['data'],
  })

  return isLoadingRenamed
}
