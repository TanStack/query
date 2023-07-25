import { useQuery } from '@tanstack/react-query'
import { Suspense } from 'react'

export function App() {
  return (
    <div className="p-10">
      <h1 className="font-bold pb-2">App</h1>

      <div>
        Note that the logs from "waitFn" are only on the server - the queries
        are not made on the client.
      </div>

      <div className="py-3">
        <hr />
      </div>

      <Suspense fallback={<div>{`outer waiting...`}</div>}>
        <WaiterInner wait={2000} deferStream />

        <Waiter wait={1000} />
        <Waiter wait={4000} />
        <Waiter wait={6000} />
      </Suspense>
    </div>
  )
}

const Waiter = (props: { wait: number }) => {
  return (
    <Suspense fallback={<div>{`waiting ${props.wait}...`}</div>}>
      <WaiterInner {...props} />
    </Suspense>
  )
}

const WaiterInner = ({
  wait,
  deferStream,
}: {
  wait: number
  deferStream?: boolean
}) => {
  const query = useQuery({
    queryKey: ['wait', wait],
    queryFn: () => waitFn(wait),
    meta: {
      deferStream,
    },
  })

  return (
    <div>
      result: {query.data?.msg}
      {deferStream ? ' (deferred stream)' : ''}
    </div>
  )
}

const waitFn = async (wait: number) => {
  console.log(`waitFn for ${wait}ms`)

  await new Promise((r) => setTimeout(r, wait))

  return {
    msg: `waited ${wait}ms`,
  }
}
