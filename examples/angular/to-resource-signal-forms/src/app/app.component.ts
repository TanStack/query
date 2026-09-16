import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core'
import {
  FormField,
  applyEach,
  form,
  minLength,
  required,
  submit as submitForm,
  validateAsync,
} from '@angular/forms/signals'
import {
  injectMutation,
  injectQuery,
  toResource,
} from '@tanstack/angular-query'
import { ValidationQueriesService } from './validation-queries.service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [FormField],
  styleUrl: './app.component.css',
  template: `
    <main>
      <h1>Username availability</h1>
      <p>
        Signal Forms uses a Resource backed by TanStack Query for async
        validation. Try <code>taken</code> or any other username.
      </p>

      <form (submit)="submit($event)">
        <label>
          Username
          <input [formField]="registrationForm.username" />
        </label>

        @if (registrationForm.username().pending()) {
          <p class="checking">Checking availability...</p>
        }

        @if (
          registrationForm.username().touched() &&
          registrationForm.username().invalid()
        ) {
          @for (error of registrationForm.username().errors(); track $index) {
            <p class="error">{{ error.message }}</p>
          }
        }

        @if (
          registrationForm.username().touched() &&
          registrationForm.username().valid()
        ) {
          <p class="success">Username is available.</p>
        }

        <p class="hint">
          Invite-code validators are added with each array item. The query
          resource does not exist until an invite code is added.
        </p>

        <button type="button" (click)="addInviteCode()">Add invite code</button>

        @for (
          inviteCode of registrationForm.inviteCodes;
          track $index;
          let index = $index
        ) {
          <div class="invite-code-row">
            <label>
              Invite code {{ index + 1 }}
              <input [formField]="inviteCode" />
            </label>

            <button type="button" (click)="removeInviteCode(index)">
              Remove
            </button>

            @if (inviteCode().pending()) {
              <p class="checking">Checking invite code...</p>
            }

            @if (inviteCode().touched() && inviteCode().invalid()) {
              @for (error of inviteCode().errors(); track $index) {
                <p class="error">{{ error.message }}</p>
              }
            }

            @if (inviteCode().touched() && inviteCode().valid()) {
              <p class="success">Invite code is valid.</p>
            }
          </div>
        }

        <button type="button" (click)="registrationForm().reloadValidation()">
          Request validation again
        </button>

        <button type="submit" [disabled]="registrationMutation.isPending()">
          {{ registrationMutation.isPending() ? 'Saving...' : 'Submit' }}
        </button>

        @if (registrationMutation.isError()) {
          <p class="error">Could not submit the registration.</p>
        }

        @if (
          registrationMutation.isSuccess() && registrationMutation.data().ok
        ) {
          <p class="success">
            Registration accepted for
            <code>{{ registrationMutation.variables().username }}</code
            >.
          </p>
          <p class="hint">
            Mutation variables included
            {{ registrationMutation.variables().inviteCodes.length }}
            invite code(s).
          </p>
        }
      </form>
    </main>
  `,
})
export class AppComponent {
  private readonly queries = inject(ValidationQueriesService)
  readonly model = signal({ username: '', inviteCodes: [] as Array<string> })
  readonly registrationMutation = injectMutation(() =>
    this.queries.submitRegistration(),
  )

  readonly registrationForm = form(this.model, (path) => {
    required(path.username, { message: 'Username is required' })
    minLength(path.username, 3, {
      message: 'Username must be at least 3 characters',
    })

    validateAsync(path.username, {
      debounce: 300,
      params: ({ value }) => value().trim() || undefined,
      factory: (username) => {
        const query = injectQuery(() => {
          const name = username() ?? ''
          return {
            ...this.queries.usernameAvailability(name),
            enabled: !!name,
          }
        })

        return toResource(query)
      },
      onSuccess: (result) =>
        result.available
          ? null
          : {
              kind: 'usernameTaken',
              message: 'Username is already taken',
            },
      onError: () => ({
        kind: 'usernameUnavailable',
        message: 'Could not check username availability',
      }),
    })

    applyEach(path.inviteCodes, (inviteCode) => {
      required(inviteCode, { message: 'Invite code is required' })
      minLength(inviteCode, 3, {
        message: 'Invite code must be at least 3 characters',
      })

      validateAsync(inviteCode, {
        debounce: 300,
        params: ({ value }) => value().trim() || undefined,
        factory: (code) => {
          const query = injectQuery(() => {
            const value = code() ?? ''
            return {
              ...this.queries.inviteCodeValidation(value),
              enabled: !!value,
            }
          })

          return toResource(query)
        },
        onSuccess: (result) =>
          result.valid
            ? null
            : {
                kind: 'invalidInviteCode',
                message: 'Invite code must start with TEAM-',
              },
        onError: () => ({
          kind: 'inviteCodeUnavailable',
          message: 'Could not check the invite code',
        }),
      })
    })
  })

  addInviteCode() {
    this.model.update((model) => ({
      ...model,
      inviteCodes: [...model.inviteCodes, ''],
    }))
  }

  removeInviteCode(index: number) {
    this.model.update((model) => ({
      ...model,
      inviteCodes: model.inviteCodes.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }))
  }

  async submit(event: SubmitEvent) {
    event.preventDefault()

    const success = await submitForm(this.registrationForm, {
      ignoreValidators: 'none',
      action: async (field) => {
        const result = await this.registrationMutation.mutateAsync(
          field().value(),
        )

        if (!result.ok) {
          return result.errors.map((error) => ({
            fieldTree:
              error.fieldPath[0] === 'username'
                ? this.registrationForm.username
                : this.registrationForm.inviteCodes[error.fieldPath[1]],
            kind: 'server',
            message: error.error,
          }))
        }

        return undefined
      },
    })
    if (success) {
      this.model.set({ username: '', inviteCodes: [] })
    }
  }
}
