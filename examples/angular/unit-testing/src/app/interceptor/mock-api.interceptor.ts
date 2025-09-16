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

let callNumber = 0

export const mockInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<any>> => {
  const respondWith = (status: number, body: any) =>
    of(new HttpResponse({ status, body })).pipe(delay(1000))
  if (req.url === '/api/tasks') {
    switch (req.method) {
      case 'GET':
        callNumber++
        if (callNumber === 1) {
          return respondWith(
            200,
            JSON.parse(sessionStorage.getItem('unit-testing-tasks') || '[]'),
          )
        } else {
          return respondWith(
            200,
            JSON.parse(
              sessionStorage.getItem('unit-testing-tasks') || '[]',
            ).concat([`CallNumber ${callNumber}`]),
          )
        }
      case 'POST':
        const tasks = JSON.parse(
          sessionStorage.getItem('unit-testing-tasks') || '[]',
        )
        tasks.push(req.body)
        sessionStorage.setItem('unit-testing-tasks', JSON.stringify(tasks))
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
