import { getQueryClient, noop } from '@tanstack/marko-query'
import { brokenThrowQueryOptions } from '../../lib/queries.ts'

// Prefetch so the failure is already in the cache when the page renders. The
// tag then throws during the server render, and `<@catch>` renders the fallback
// in the HTML instead of waiting for the browser.
export const GET = Run.GET(async (context, next) => {
  await getQueryClient(context).query(brokenThrowQueryOptions).catch(noop)
  return next()
})
