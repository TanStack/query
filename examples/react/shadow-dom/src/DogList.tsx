import { useQuery } from '@tanstack/react-query'
import { dogsQueryOptions } from './api'

export const DogList = () => {
  const { data, status } = useQuery(dogsQueryOptions)

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
