import { Link as RouterLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCharacters } from './api'

export default function Characters() {
  const { status, data } = useQuery({
    queryKey: ['characters'],
    queryFn: () => getCharacters(),
  })

  if (status === 'pending') return <p>Loading...</p>
  if (status === 'error') return <p>Error :(</p>

  return (
    <div>
      <h2 className="text-4xl">Characters</h2>
      {data.results.map((person: any) => {
        return (
          <article key={person.id}>
            <RouterLink
              className="text-blue-500 hover:underline"
              to={`/characters/${person.id}`}
            >
              <h6 className="text-xl">
                {person.name} - {person.gender}: {person.species}
              </h6>
            </RouterLink>
          </article>
        )
      })}
    </div>
  )
}
