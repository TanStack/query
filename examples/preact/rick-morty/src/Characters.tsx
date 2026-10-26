import { useQuery } from '@tanstack/preact-query'
import { charactersQueries } from './services/characters/queries'

export default function Characters() {
  const { status, data } = useQuery(charactersQueries.list())

  if (status === 'pending') return <p>Loading...</p>
  if (status === 'error') return <p>Error :(</p>

  return (
    <div>
      <h2 className="text-4xl">Characters</h2>
      {data.results.map((person) => {
        return (
          <article key={person.id}>
            <a
              className="text-blue-500 hover:underline"
              href={`/characters/${person.id}`}
            >
              <h6 className="text-xl">
                {person.name} - {person.gender}: {person.species}
              </h6>
            </a>
          </article>
        )
      })}
    </div>
  )
}
