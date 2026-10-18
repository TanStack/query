import { queryOptions } from '@tanstack/react-query'

type DogsResp = {
  message: {
    [dog: string]: Array<string>
  }
}

const getDogs = async (): Promise<DogsResp> => {
  const res = await fetch('https://dog.ceo/api/breeds/list/all')
  if (!res.ok) throw new Error('something went wrong')
  return await res.json()
}

export const dogsQueryOptions = queryOptions({
  queryKey: ['dogs'],
  queryFn: getDogs,
})
