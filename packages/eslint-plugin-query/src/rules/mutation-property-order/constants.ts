export const mutationFunctions = ['useMutation'] as const

export type MutationFunctions = (typeof mutationFunctions)[number]

export const checkedProperties = ['onMutate', 'onError', 'onSettled'] as const

export type MutationProperties = (typeof checkedProperties)[number]

export const sortRules = [[['onMutate'], ['onError', 'onSettled']]] as const
