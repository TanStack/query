'use server'

import { revalidatePath } from 'next/cache'
import { countRef } from './make-query-client'

export async function queryExampleAction() {
  await Promise.resolve()
  countRef.current++
  revalidatePath('/', 'page')
  return undefined
}
