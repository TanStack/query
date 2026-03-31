import { HttpResponse } from '@angular/common/http'
import { delayWhen, of, timer } from 'rxjs'
import type { Observable } from 'rxjs'
import type { HttpEvent, HttpInterceptorFn } from '@angular/common/http'

export const autocompleteMockInterceptor: HttpInterceptorFn = (
  req,
  next,
): Observable<HttpEvent<any>> => {
  const { url } = req

  if (url.includes('/api/autocomplete')) {
    const term = new URLSearchParams(req.url.split('?')[1]).get('term') || ''

    const data = [
      'C#',
      'C++',
      'Go',
      'Java',
      'JavaScript',
      'Kotlin',
      'Lisp',
      'Objective-C',
      'PHP',
      'Perl',
      'Python',
      'R',
      'Ruby',
      'Rust',
      'SQL',
      'Scala',
      'Shell',
      'Swift',
      'TypeScript',
    ]

    // Simulate network latency with a random delay between 100ms and 500ms
    const delayDuration = Math.random() * (500 - 100) + 100
    return of(
      new HttpResponse({
        status: 200,
        body: {
          suggestions: data.filter((item) =>
            item.toLowerCase().startsWith(term.toLowerCase()),
          ),
        },
      }),
    ).pipe(delayWhen(() => timer(delayDuration)))
  }
  return next(req)
}
