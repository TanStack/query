import * as ngCore from '@angular/core'

export const RESOURCE_PARAMS_STATUS = Symbol('RESOURCE_PARAMS_STATUS')
export const RESOURCE_PARAMS_ERROR = Symbol('RESOURCE_PARAMS_ERROR')

export type ResourceParamsStatusType = 'loading' | 'idle' | 'error'

export function getResourceParamsStatus(
  error: unknown,
): ResourceParamsStatusType | undefined {
  if (!error) return undefined

  const ResourceParamsStatus = (ngCore as any).ResourceParamsStatus
  if (ResourceParamsStatus) {
    if (error === ResourceParamsStatus.LOADING) return 'loading'
    if (error === ResourceParamsStatus.IDLE) return 'idle'
  }

  const ResourceDependencyError = (ngCore as any).ResourceDependencyError
  if (ResourceDependencyError && error instanceof ResourceDependencyError) {
    return 'error'
  }

  if (error instanceof Error) {
    if (
      error.constructor.name === 'ResourceParamsStatus' ||
      (error as any)._brand !== undefined
    ) {
      if (error.message === 'LOADING') return 'loading'
      if (error.message === 'IDLE') return 'idle'
    }
    if (
      error.constructor.name === 'ResourceDependencyError' ||
      error.name === 'ResourceDependencyError'
    ) {
      return 'error'
    }
  }

  return undefined
}
