---
name: compositions/query-data-and-forms
description: >
  Use this when integrating TanStack Query data and mutations with forms:
  initial server state, editable client state, dirty fields, background updates,
  submit prevention, invalidation, reset-after-save, validation errors, and
  avoiding blind copies from Query cache into local form state.
type: composition
library: TanStack Query
library_version: "5.101.0"
requires:
  - core/write-mutations-and-invalidate-related-queries
  - core/selectors-and-derived-state
sources:
  - https://tkdodo.eu/blog/react-query-and-forms
  - https://tkdodo.eu/blog/deriving-client-state-from-server-state
  - TanStack/query:docs/framework/react/guides/mutations.md
  - TanStack/query:docs/framework/react/guides/invalidations-from-mutations.md
---

## Core Patterns

Treat form state as client state after the user starts editing. Server state can initialize the form, but it should not be copied blindly on every query update.

### Initial data only

Use this when one user owns the form and background updates are not useful while editing.

```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

function PersonDetail({ id }: { id: string }) {
  const queryClient = useQueryClient()
  const person = useQuery({ queryKey: ['person', id], queryFn: () => fetchPerson(id), staleTime: Infinity })

  const updatePerson = useMutation({
    mutationFn: savePerson,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['person', id] }),
  })

  if (!person.data) return <p>Loading...</p>
  return <PersonForm person={person.data} isSaving={updatePerson.isPending} onSubmit={updatePerson.mutate} />
}
```

### Derived server plus client state

Use this when background updates should remain visible for untouched fields.

```tsx
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'

function PersonName({ id }: { id: string }) {
  const { data } = useQuery({ queryKey: ['person', id], queryFn: () => fetchPerson(id) })
  const [draft, setDraft] = React.useState<{ firstName?: string }>({})

  if (!data) return <p>Loading...</p>

  return (
    <input
      value={draft.firstName ?? data.firstName}
      onChange={(event) => setDraft({ firstName: event.target.value })}
    />
  )
}
```

### Reset after awaited invalidation

```tsx
const mutation = useMutation({
  mutationFn: savePerson,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['person', id] }),
})

function submit(values: PersonFormValues) {
  mutation.mutate(values, { onSuccess: () => resetFormDraft() })
}
```

Return the invalidation promise from `onSuccess` or `onSettled` when the saved server state must be back in the cache before the form resets.

## Common Mistakes

### HIGH Initializing form defaults before query data exists

Wrong:

```tsx
const { data } = useQuery({ queryKey: ['person', id], queryFn: () => fetchPerson(id) })
const [draft, setDraft] = React.useState(data)
```

Correct:

```tsx
const { data } = useQuery({ queryKey: ['person', id], queryFn: () => fetchPerson(id) })
if (!data) return <p>Loading...</p>
return <PersonForm initialPerson={data} />
```

The first render usually has no query data. Split the form boundary or derive field values from query data plus draft state.

Source: https://tkdodo.eu/blog/react-query-and-forms

### HIGH Background refetch overwrites or hides dirty client state

Wrong:

```tsx
React.useEffect(() => {
  setDraft(personQuery.data)
}, [personQuery.data])
```

Correct:

```tsx
const shownFirstName = draft.firstName ?? personQuery.data?.firstName ?? ''
```

Do not synchronize every server update into the draft. Derive displayed values or intentionally opt out of background updates for initial-only forms.

Source: https://tkdodo.eu/blog/deriving-client-state-from-server-state

### MEDIUM Form submit can run twice

Wrong:

```tsx
<button type="submit">Save</button>
```

Correct:

```tsx
<button type="submit" disabled={mutation.isPending}>Save</button>
```

Use mutation state to block duplicate writes while a submission is in flight.

Source: https://tkdodo.eu/blog/react-query-and-forms

