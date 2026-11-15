import '@awesome.me/webawesome/dist/styles/themes/default.css'
import '@awesome.me/webawesome/dist/components/toast/toast.js'

const toaster = document.createElement('wa-toast')
document.body.append(toaster)

export const toast = {
  success: (message: string) => toaster.create(message, { variant: 'success' }),
  error: (message: string) => toaster.create(message, { variant: 'danger' }),
}
