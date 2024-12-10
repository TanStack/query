import { Component, inject } from '@angular/core'
import { injectQuery } from '@tanstack/angular-query-experimental'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { DatePipe } from '@angular/common'

interface SessionData {
  lastActive: string
  currentView: string
  activeFilters: Array<string>
  temporaryNotes: string
}

@Component({
  selector: 'session-data',
  template: `
    @if (sessionData.isLoading()) {
      <div class="animate-pulse p-6 bg-white rounded-lg shadow-md">
        <div class="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    } @else if (sessionData.isError()) {
      <div class="p-6 bg-red-50 rounded-lg shadow-md text-red-600">
        Error loading session data: {{ sessionData.error() }}
      </div>
    } @else {
      <div class="p-6 bg-white rounded-lg shadow-md">
        <div class="flex items-center gap-2 mb-4">
          🔑
          <h2 class="text-xl font-semibold">
            Session Data
            <span class="italic text-sm">(stored in sessionStorage)</span>
          </h2>
        </div>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-gray-600">Last Active:</span>
            <span class="font-medium">
              {{ sessionData.data()?.lastActive | date }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Current View:</span>
            <span class="font-medium">{{
              sessionData.data()?.currentView
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Active Filters:</span>
            <span class="font-medium">
              {{ sessionData.data()?.activeFilters?.join(', ') }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Temporary Notes:</span>
            <span class="font-medium">{{
              sessionData.data()?.temporaryNotes
            }}</span>
          </div>
        </div>
      </div>
    }
  `,
  standalone: true,
  imports: [DatePipe],
})
export class SessionDataComponent {
  #http = inject(HttpClient)

  sessionData = injectQuery(() => ({
    queryKey: ['session'],
    queryFn: () => firstValueFrom(this.#http.get<SessionData>('/session')),
    staleTime: 1000 * 60 * 60, // 1 hour
  }))
}
