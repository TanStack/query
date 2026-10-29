import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { authorOptions } from '../queries'

const routeApi = getRouteApi('/authors/$authorId')

export function Author() {
  const { authorId } = routeApi.useParams()
  const { data } = useSuspenseQuery(authorOptions(authorId))
  return data.name
}
