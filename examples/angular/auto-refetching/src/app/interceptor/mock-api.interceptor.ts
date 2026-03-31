/**
 * MockApiInterceptor is used to simulate API responses for `/api/tasks` endpoints.
 * It handles the following operations:
 * - GET: Fetches all tasks from localStorage.
 * - POST: Adds a new task to localStorage.
 * - DELETE: Clears all tasks from localStorage.
 * Simulated responses include a delay to mimic network latency.
 */
import { HttpResponse } from '@angular/common/http'
import { delay, of } from 'rxjs'
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
    of(new HttpResponse({ status, body })).pipe(delay(100))
  if (req.url === '/api/tasks') {
    switch (req.method) {
      case 'GET':
        return respondWith(
          200,
          JSON.parse(localStorage.getItem('tasks') || '[]'),
        )
      case 'POST':
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]')
        tasks.push(req.body)
        localStorage.setItem('tasks', JSON.stringify(tasks))
        return respondWith(201, {
          status: 'success',
          task: req.body,
        })
      case 'DELETE':
        localStorage.removeItem('tasks')
        return respondWith(200, { status: 'success' })
    }
  }
  return next(req)
}
