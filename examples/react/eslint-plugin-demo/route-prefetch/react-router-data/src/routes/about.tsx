import { useSuspenseQuery } from '@tanstack/react-query'
import { teamOptions } from '../queries'

export function About() {
  const { data: team } = useSuspenseQuery(teamOptions())

  return (
    <ul>
      {team.map((member) => (
        <li key={member.id}>{member.name}</li>
      ))}
    </ul>
  )
}
