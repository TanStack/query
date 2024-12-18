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
  if (req.url === '/preferences') {
    return respondWith(200, {
      theme: 'dark',
      language: 'en',
      notifications: true,
      fontSize: 'medium',
    })
  }

  if (req.url === '/session') {
    return respondWith(200, {
      lastActive: '2024-02-28T12:00:00Z',
      currentView: 'dashboard',
      activeFilters: ['recent', 'important'],
      temporaryNotes: 'Meeting at 3PM',
    })
  }
  return next(req)
}
