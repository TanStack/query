import { useQuery } from '@tanstack/react-query'
import { dogsQueries } from './services/dogs/queries'

export const DogList = () => {
  const { data, status } = useQuery(dogsQueries.list())

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
