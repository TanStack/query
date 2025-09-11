/**
 * MockApiInterceptor is used to simulate API responses for `/api/tasks` endpoints.
 * It handles the following operations:
 * - GET: Fetches all tasks from sessionStorage.
 * - POST: Adds a new task to sessionStorage.
 * Simulated responses include a delay to mimic network latency.
 */
import { HttpResponse } from '@angular/common/http'
import { delay, of, throwError } from 'rxjs'
import type {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http'
import type { Observable } from 'rxjs'

export const mockInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<any>> => {
  const respondWith = (status: number, body: any) =>
    of(new HttpResponse({ status, body })).pipe(delay(1000))
  if (req.url === '/api/tasks') {
    switch (req.method) {
      case 'GET':
        return respondWith(
          200,
          JSON.parse(
            sessionStorage.getItem('optimistic-updates-tasks') || '[]',
          ),
        )
      case 'POST':
        const tasks = JSON.parse(
          sessionStorage.getItem('optimistic-updates-tasks') || '[]',
        )
        tasks.push(req.body)
        sessionStorage.setItem(
          'optimistic-updates-tasks',
          JSON.stringify(tasks),
        )
        return respondWith(201, {
          status: 'success',
          task: req.body,
        })
    }
  }
  if (req.url === '/api/tasks-wrong-url') {
    return throwError(() => new Error('error')).pipe(delay(1000))
  }

  return next(req)
}
