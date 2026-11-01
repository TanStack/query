import { Link as RouterLink, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { charactersQueries } from './services/characters/queries'
import { episodesQueries } from './services/episodes/queries'
import { locationsQueries } from './services/locations/queries'

function Character() {
  const params = useParams()
  const characterId = params.characterId!

  const { status, data } = useQuery(charactersQueries.detail(characterId))

  if (status === 'pending') return <p>Loading...</p>
  if (status === 'error') return <p>Error :(</p>

  const locationUrlParts = data.location.url.split('/').filter(Boolean)
  const locationId = locationUrlParts[locationUrlParts.length - 1]

  return (
    <div>
      <h2 className="text-4xl">{data.name}</h2>
      <p>
        <strong>Gender</strong>: {data.gender}
      </p>
      <p>
        <strong>Status</strong>: {data.status}
      </p>
      <p>
        <strong>Species</strong>: {data.species}
      </p>
      <p>
        <strong>Origin</strong>: {data.origin.name}
      </p>
      <p>
        <strong>Location</strong>:{' '}
        {locationId ? <Location locationId={locationId} /> : data.location.name}
      </p>

      <h4 className="text-2xl pt-4">Episodes</h4>
      {data.episode.map((episode) => {
        const episodeUrlParts = episode.split('/').filter(Boolean)
        const episodeId = episodeUrlParts[episodeUrlParts.length - 1]
        return <Episode episodeId={episodeId} key={`${episodeId}`} />
      })}
    </div>
  )
}

function Episode({ episodeId }: { episodeId: string }) {
  const { data, status } = useQuery(episodesQueries.detail(episodeId))

  if (status === 'success') {
    return (
      <article key={episodeId}>
        <RouterLink
          className="text-blue-500 hover:underline"
          to={`/episodes/${episodeId}`}
        >
          <h6 className="text-lg">
            {data.episode}. {data.name} - {data.air_date}
          </h6>
        </RouterLink>
      </article>
    )
  }
}

function Location({ locationId }: { locationId: string }) {
  const { data, status } = useQuery(locationsQueries.detail(locationId))

  if (status === 'pending') return <span>Loading...</span>
  if (status === 'error') return <span>Error :(</span>

  return (
    <span>
      {data.name} - {data.type}
    </span>
  )
}

export default Character
