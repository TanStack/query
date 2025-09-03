import { HttpResponse } from '@angular/common/http'
import { delay, of } from 'rxjs'
import type { Observable } from 'rxjs'
import type { HttpEvent, HttpInterceptorFn } from '@angular/common/http'

export const projectsMockInterceptor: HttpInterceptorFn = (
  req,
  next,
): Observable<HttpEvent<any>> => {
  const { url } = req

  if (url.includes('/api/projects')) {
    const page = parseInt(
      new URLSearchParams(req.url.split('?')[1]).get('page') || '0',
      10,
    )
    const pageSize = 10

    const projects = Array(pageSize)
      .fill(0)
      .map((_, i) => {
        const id = page * pageSize + (i + 1)
        return {
          name: 'Project ' + id,
          id,
        }
      })

    return of(
      new HttpResponse({
        status: 200,
        body: {
          projects,
          hasMore: page < 9,
        },
      }),
    ).pipe(delay(1000))
  }
  return next(req)
}
