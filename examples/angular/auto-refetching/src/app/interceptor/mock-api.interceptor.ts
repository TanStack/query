/**
 * MockApiInterceptor is used to simulate API responses for `/api/tasks` endpoints.
 * It handles the following operations:
 * - GET: Fetches all tasks from localStorage.
 * - POST: Adds a new task to localStorage.
 * - DELETE: Clears all tasks from localStorage.
 * Simulated responses include a delay to mimic network latency.
 */
import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { delay, of } from 'rxjs';
import type { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import type { Observable } from 'rxjs';

@Injectable()
export class MockApiInterceptor implements HttpInterceptor {


    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        if (req.url === '/api/tasks') {
            switch (req.method) {
                case 'GET':
                    return this.respondWith(200, JSON.parse(localStorage.getItem('tasks') || '[]')).pipe(delay(100));
                case 'POST':
                    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                    tasks.push(req.body);
                    localStorage.setItem('tasks', JSON.stringify(tasks));
                    return this.respondWith(201, { status: 'success', task: req.body }).pipe(delay(100));
                case 'DELETE':
                    localStorage.removeItem('tasks');
                    return this.respondWith(200, { status: 'success' }).pipe(delay(100));
            }
        }
        return next.handle(req);
    }

    private respondWith(status: number, body: any): Observable<HttpResponse<any>> {
        return of(new HttpResponse({ status, body }));
    }
}
