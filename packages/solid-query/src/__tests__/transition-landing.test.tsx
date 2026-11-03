import { expect, it } from 'vitest'
import {
  createMemo,
  createRenderEffect,
  createRoot,
  createSignal,
  flush,
} from 'solid-js'
import { QueryClient, useQuery } from '..'

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

it('continues transitioning after a query is disposed during landing', async () => {
  const gates: Array<() => void> = []
  const shown: Array<number> = []
  const [step, setStep] = createSignal(0)
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
    },
  })

  const flight = (value: number) =>
    value > 0
      ? new Promise<void>((resolve) => gates.push(resolve)).then(() => value)
      : Promise.resolve(value)

  const drain = async () => {
    for (let round = 0; round < 6; round++) {
      for (const release of gates.splice(0)) release()
      await tick()
      flush()
      await tick()
    }
  }

  let dispose = () => {}

  try {
    createRoot((cleanup) => {
      dispose = cleanup

      const screen = createMemo(() => {
        const value = step()
        const query = useQuery(
          () => ({
            queryKey: ['transition-landing'],
            queryFn: () => Promise.resolve('answer'),
          }),
          () => client,
        )
        return () => (query.isSuccess ? value : -1)
      })

      const pending = createMemo(async () => flight(step()))

      createRenderEffect(
        () => [screen()(), pending()] as const,
        ([value]) => {
          shown.push(value)
        },
      )
    })

    flush()
    await drain()

    setStep(1)
    flush()
    await tick()

    setStep(2)
    flush()
    await drain()

    setStep(3)
    flush()
    await drain()

    expect(step()).toBe(3)
    expect(shown.at(-1)).toBe(3)
  } finally {
    try {
      dispose()
    } finally {
      client.clear()
      for (const release of gates.splice(0)) release()
    }
  }
})
