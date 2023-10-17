import { ClientComponent } from '@/app/client-component'
import { queryOptions } from '@tanstack/react-query'

const options = queryOptions({
  queryKey: ['foo'],
})

export default function Home() {
  return (
    <main>
      <ClientComponent />
      Key: {JSON.stringify(options.queryKey)}
    </main>
  )
}
