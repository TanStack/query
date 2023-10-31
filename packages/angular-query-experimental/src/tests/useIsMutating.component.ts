import { Component, inject, signal } from '@angular/core'
import { CreateMutation, UseIsMutating } from '../providers'
import { successMutator } from './test-utils'

@Component({
  template: `<button (click)="onMutate()">Mutate</button> isMutating:
    {{ isMutating() }}`,
  standalone: true,
})
export class UseIsMutatingComponent {
  isMutating = inject(UseIsMutating)()
  mutation = inject(CreateMutation)(
    signal({
      mutationKey: ['isMutating1'],
      mutationFn: successMutator<{ par1: string }>,
    }),
  )
  onMutate = () => {
    this.mutation().mutate({
      par1: 'par1',
    })
  }
}
