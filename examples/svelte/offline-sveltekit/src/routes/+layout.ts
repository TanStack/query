import { worker } from '$lib/mocks'

export const ssr = false

export const load = async () => {
  await worker.start()
}
