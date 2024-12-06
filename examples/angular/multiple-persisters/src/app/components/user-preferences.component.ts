import { Component, inject } from '@angular/core'
import { injectQuery } from '@tanstack/angular-query-experimental'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'

interface UserPreferences {
  theme: string
  language: string
  notifications: boolean
  fontSize: string
}

@Component({
  selector: 'user-preferences',
  template: `
    @if (userPreferences.isLoading()) {
      <div class="animate-pulse p-6 bg-white rounded-lg shadow-md">
        <div class="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    } @else if (userPreferences.isError()) {
      <div class="p-6 bg-red-50 rounded-lg shadow-md text-red-600">
        Error loading preferences: {{ userPreferences.error() }}
      </div>
    } @else {
      <div class="p-6 bg-white rounded-lg shadow-md">
        <div class="flex items-center gap-2 mb-4">
          ⚙️
          <h2 class="text-xl font-semibold">
            User Preferences
            <span class="italic text-sm">(stored in localStorage)</span>
          </h2>
        </div>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-gray-600">Theme:</span>
            <span class="font-medium">{{ userPreferences.data()?.theme }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Language:</span>
            <span class="font-medium">{{
              userPreferences.data()?.language
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Notifications:</span>
            <span class="font-medium">{{
              userPreferences.data()?.notifications ? 'Enabled' : 'Disabled'
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Font Size:</span>
            <span class="font-medium">{{
              userPreferences.data()?.fontSize
            }}</span>
          </div>
        </div>
      </div>
    }
  `,
  standalone: true,
  imports: [],
})
export class UserPreferencesComponent {
  #http = inject(HttpClient)

  userPreferences = injectQuery(() => ({
    queryKey: ['preferences'],
    queryFn: () =>
      firstValueFrom(this.#http.get<UserPreferences>('/preferences')),
    staleTime: 1000 * 60 * 60, // 1 hour
  }))
}
