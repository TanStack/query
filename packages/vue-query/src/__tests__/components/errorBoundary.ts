import { onErrorCaptured, ref } from 'vue-demi'

export default {
  template: `
    <div v-if='!error'>
    <slot></slot>
    </div>
    <p v-else>
    <slot name='error'>error boundary</slot>
    </p>`,
  setup() {
    const error = ref()
    onErrorCaptured((e) => {
      error.value = e
      return false
    })
    return {
      error,
    }
  },
}
