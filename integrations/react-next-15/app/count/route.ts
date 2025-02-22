import { countRef } from '../make-query-client'

export const GET = () => {
  return Response.json({ count: countRef.current })
}
