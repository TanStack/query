import { useQuery } from '@tanstack/react-query'

type DogsResp = {
  message: {
    [dog: string]: Array<string>
  }
}

export const DogList = () => {
  const { data, status } = useQuery<DogsResp>({
    queryKey: ['dogs'],
    queryFn: async () => {
      const resp = await fetch('https://dog.ceo/api/breeds/list/all')
      if (resp.ok) {
        return resp.json()
      }
      throw new Error('something went wrong')
    },
  })

  if (status === 'pending') return 'Loading...'

  if (status === 'error') return 'Error!'

  const dogs = Object.keys(data.message)

  return (
    <div>
      {dogs.map((dog) => (
        <div key={dog}>{dog}</div>
      ))}
    </div>
  )
}
