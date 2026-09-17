import { Injectable } from '@angular/core'
import { mutationOptions, queryOptions } from '@tanstack/angular-query'

export type UsernameValidation = {
  available: boolean
}

export type InviteCodeValidation = {
  valid: boolean
}

export type RegistrationData = {
  username: string
  inviteCodes: Array<string>
}

export type RegistrationMutationResult =
  | { ok: true }
  | {
      ok: false
      errors: Array<{
        fieldPath: ['username'] | ['inviteCodes', number]
        error: string
      }>
    }

@Injectable({ providedIn: 'root' })
export class ValidationQueriesService {
  usernameAvailability(username: string) {
    return queryOptions({
      queryKey: ['username-availability', username],
      gcTime: 15_000,
      queryFn: async (): Promise<UsernameValidation> => {
        await this.delay()
        return { available: username.toLowerCase() !== 'taken' }
      },
    })
  }

  inviteCodeValidation(code: string) {
    return queryOptions({
      queryKey: ['invite-code-validation', code],
      gcTime: 15_000,
      staleTime: 30_000,
      queryFn: async (): Promise<InviteCodeValidation> => {
        await this.delay()
        return { valid: code.toUpperCase().startsWith('TEAM-') }
      },
    })
  }

  submitRegistration() {
    return mutationOptions({
      gcTime: 20_000,
      mutationFn: async (
        variables: RegistrationData,
      ): Promise<RegistrationMutationResult> => {
        await this.delay()

        const errors: Array<{
          fieldPath: ['username'] | ['inviteCodes', number]
          error: string
        }> = []

        if (variables.username.toLowerCase().includes('error')) {
          errors.push({
            fieldPath: ['username'],
            error: 'This username cannot be registered',
          })
        }

        variables.inviteCodes.forEach((inviteCode, index) => {
          if (inviteCode.toLowerCase().includes('error')) {
            errors.push({
              fieldPath: ['inviteCodes', index],
              error: 'This invite code cannot be registered',
            })
          }
        })

        return errors.length > 0 ? { ok: false, errors } : { ok: true }
      },
    })
  }

  private delay() {
    return new Promise((resolve) => setTimeout(resolve, 450))
  }
}
