export const mutationFunctions = ['useMutation'] as const

/**
 * The names of the functions whose options the `mutation-property-order` rule checks.
 */
export type MutationFunctions = (typeof mutationFunctions)[number]

export const checkedProperties = ['onMutate', 'onError', 'onSettled'] as const

/**
 * The option properties whose order the `mutation-property-order` rule checks.
 */
export type MutationProperties = (typeof checkedProperties)[number]

export const sortRules = [[['onMutate'], ['onError', 'onSettled']]] as const
