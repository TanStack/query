import type { DogsResp } from './types'

export const dogsAPI = {
  getDogs: async (): Promise<DogsResp> => {
    const res = await fetch('https://dog.ceo/api/breeds/list/all')
    if (!res.ok) throw new Error('something went wrong')
    return await res.json()
  },
}
