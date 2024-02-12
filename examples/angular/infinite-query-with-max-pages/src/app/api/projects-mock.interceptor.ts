import { HttpResponse } from '@angular/common/http'
import { delayWhen, of, timer } from 'rxjs'
import type { Observable } from 'rxjs'
import type { HttpEvent, HttpInterceptorFn } from '@angular/common/http'

export const projectsMockInterceptor: HttpInterceptorFn = (
  req,
  next,
): Observable<HttpEvent<any>> => {
  const { url } = req

  if (url.includes('/api/projects')) {
    const cursor = parseInt(
      new URLSearchParams(req.url.split('?')[1]).get('cursor') || '0',
      10,
    )
    const pageSize = 4

    const data = Array(pageSize)
      .fill(0)
      .map((_, i) => {
        return {
          name: 'Project ' + (i + cursor) + ` (server time: ${Date.now()})`,
          id: i + cursor,
        }
      })

    const nextId = cursor < 20 ? data[data.length - 1].id + 1 : null
    const previousId = cursor > -20 ? data[0].id - pageSize : null

    // Simulate network latency with a random delay between 100ms and 500ms
    const delayDuration = Math.random() * (500 - 100) + 100
    return of(
      new HttpResponse({
        status: 200,
        body: {
          data,
          nextId,
          previousId,
        },
      }),
    ).pipe(delayWhen(() => timer(delayDuration)))
  }
  return next(req)
}
