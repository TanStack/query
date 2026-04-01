import { expectTypeOf } from 'expect-type'
import { QueryClient } from '@tanstack/query-core'
import {
  type UseMutationOptions,
  type UseMutationResult,
  mutationOptions,
  useIsMutating,
  useMutation,
  useQueryClient,
} from '..'
import { doNotExecute } from './utils'
import type { MutationKey, OmitKeyof, WithRequired } from '@tanstack/query-core'

const mutationKey = ['key'] as const
const mutationFn = (_input: { id: string }) =>
  Promise.resolve({ field: 'success' })

describe('mutationOptions', () => {
  it('should not allow excess properties', () => {
    doNotExecute(() => {
      // @ts-expect-error this is a good error, because onMutates does not exist!
      mutationOptions({
        mutationFn: () => Promise.resolve(5),
        mutationKey: ['key'],
        onMutates: 1000,
        onSuccess: (data) => {
          expectTypeOf(data).toEqualTypeOf<number>()
        },
      })
    })
  })

  it('should infer types for callbacks', () => {
    doNotExecute(() => {
      mutationOptions({
        mutationFn: () => Promise.resolve(5),
        mutationKey: ['key'],
        onSuccess: (data) => {
          expectTypeOf(data).toEqualTypeOf<number>()
        },
      })
    })
  })

  it('should infer types for onError callback', () => {
    doNotExecute(() => {
      mutationOptions({
        mutationFn: () => {
          throw new Error('fail')
        },
        mutationKey: ['key'],
        onError: (error) => {
          expectTypeOf(error).toEqualTypeOf<unknown>()
        },
      })
    })
  })

  it('should infer types for variables', () => {
    doNotExecute(() => {
      mutationOptions<number, unknown, { id: string }>({
        mutationFn: (vars) => {
          expectTypeOf(vars).toEqualTypeOf<{ id: string }>()
          return Promise.resolve(5)
        },
        mutationKey: ['with-vars'],
      })
    })
  })

  it('should infer context type correctly', () => {
    doNotExecute(() => {
      mutationOptions<number, unknown, void, { name: string }>({
        mutationFn: () => Promise.resolve(5),
        mutationKey: ['key'],
        onMutate: () => {
          return { name: 'context' }
        },
        onSuccess: (_data, _variables, context) => {
          expectTypeOf(context).toEqualTypeOf<{ name: string } | undefined>()
        },
      })
    })
  })

  it('should error if mutationFn return type mismatches TData', () => {
    doNotExecute(() => {
      mutationOptions<number>({
        // @ts-expect-error this is a good error, because return type is string, not number
        mutationFn: async () => Promise.resolve('wrong return'),
      })
    })
  })

  it('should allow mutationKey to be omitted', () => {
    doNotExecute(() => {
      mutationOptions({
        mutationFn: () => Promise.resolve(123),
        onSuccess: (data) => {
          expectTypeOf(data).toEqualTypeOf<number>()
        },
      })
    })
  })

  it('should infer all types when not explicitly provided', () => {
    doNotExecute(() => {
      expectTypeOf(
        mutationOptions({
          mutationFn: (id: string) => Promise.resolve(id.length),
          mutationKey: ['key'],
          onSuccess: (data) => {
            expectTypeOf(data).toEqualTypeOf<number>()
          },
        }),
      ).toEqualTypeOf<
        WithRequired<
          UseMutationOptions<number, unknown, string, unknown>,
          'mutationKey'
        >
      >()
      expectTypeOf(
        mutationOptions({
          mutationFn: (id: string) => Promise.resolve(id.length),
          onSuccess: (data) => {
            expectTypeOf(data).toEqualTypeOf<number>()
          },
        }),
      ).toEqualTypeOf<
        OmitKeyof<
          UseMutationOptions<number, unknown, string, unknown>,
          'mutationKey'
        >
      >()
    })
  })

  it('should infer types when used with useMutation', () => {
    doNotExecute(() => {
      const mutation = useMutation(
        mutationOptions({
          mutationKey: ['key'],
          mutationFn: () => Promise.resolve('data'),
          onSuccess: (data) => {
            expectTypeOf(data).toEqualTypeOf<string>()
          },
        }),
      )
      expectTypeOf(mutation).toEqualTypeOf<
        UseMutationResult<string, unknown, void, unknown>
      >()

      // should allow when used with useMutation without mutationKey
      useMutation(
        mutationOptions({
          mutationFn: () => Promise.resolve('data'),
          onSuccess: (data) => {
            expectTypeOf(data).toEqualTypeOf<string>()
          },
        }),
      )
    })
  })

  it('should be used with useMutation and spread with additional options', () => {
    doNotExecute(() => {
      const result = useMutation({
        ...mutationOptions({
          mutationKey,
          mutationFn,
        }),
        retry: 3,
      })

      expectTypeOf(result).toEqualTypeOf<
        UseMutationResult<{ field: string }, unknown, { id: string }, unknown>
      >()
    })
  })

  it('should preserve mutationKey for use with useIsMutating/queryClient', () => {
    doNotExecute(() => {
      const options = mutationOptions({
        mutationKey: ['todos', 'create'] as const,
        mutationFn: (input: { title: string }) =>
          Promise.resolve({ id: 1, title: input.title }),
      })

      // mutationKey is MutationKey, usable with filters
      expectTypeOf(options.mutationKey).toMatchTypeOf<MutationKey>()
    })
  })

  it('should work with void variables (no arguments to mutationFn)', () => {
    doNotExecute(() => {
      const options = mutationOptions({
        mutationKey,
        mutationFn: () => Promise.resolve('done'),
      })

      const result = useMutation(options)

      // mutate should be callable without arguments
      result.mutate()
    })
  })

  it('should infer TContext from onMutate when explicitly typed', () => {
    doNotExecute(() => {
      mutationOptions<
        { success: boolean },
        unknown,
        string,
        { previousData: string }
      >({
        mutationKey,
        mutationFn: (_id: string) => Promise.resolve({ success: true }),
        onMutate: (variables) => {
          expectTypeOf(variables).toEqualTypeOf<string>()
          return { previousData: 'backup' }
        },
        onError: (_error, variables, context) => {
          expectTypeOf(variables).toEqualTypeOf<string>()
          expectTypeOf(context).toEqualTypeOf<
            { previousData: string } | undefined
          >()
        },
        onSuccess: (data, variables, context) => {
          expectTypeOf(data).toEqualTypeOf<{ success: boolean }>()
          expectTypeOf(variables).toEqualTypeOf<string>()
          expectTypeOf(context).toEqualTypeOf<
            { previousData: string } | undefined
          >()
        },
        onSettled: (data, _error, variables, context) => {
          expectTypeOf(data).toEqualTypeOf<{ success: boolean } | undefined>()
          expectTypeOf(variables).toEqualTypeOf<string>()
          expectTypeOf(context).toEqualTypeOf<
            { previousData: string } | undefined
          >()
        },
      })
    })
  })

  it('should work with complex generic types', () => {
    doNotExecute(() => {
      interface CreateUserInput {
        name: string
        email: string
        roles: Array<'admin' | 'user'>
      }

      interface User {
        id: number
        name: string
        email: string
        roles: Array<'admin' | 'user'>
        createdAt: Date
      }

      interface OptimisticContext {
        previousUsers: Array<User>
        tempId: number
      }

      const options = mutationOptions<
        User,
        unknown,
        CreateUserInput,
        OptimisticContext
      >({
        mutationKey: ['users', 'create'] as const,
        mutationFn: (input: CreateUserInput) =>
          Promise.resolve({
            id: 1,
            ...input,
            createdAt: new Date(),
          } as User),
        onMutate: (variables) => {
          expectTypeOf(variables).toEqualTypeOf<CreateUserInput>()
          return { previousUsers: [], tempId: Date.now() }
        },
        onError: (_error, _variables, context) => {
          expectTypeOf(context).toEqualTypeOf<OptimisticContext | undefined>()
        },
        onSuccess: (data, variables, context) => {
          expectTypeOf(data).toEqualTypeOf<User>()
          expectTypeOf(variables).toEqualTypeOf<CreateUserInput>()
          expectTypeOf(context).toEqualTypeOf<OptimisticContext | undefined>()
        },
      })

      const result = useMutation(options)
      expectTypeOf(result.data).toEqualTypeOf<User | undefined>()
    })
  })

  it('should be usable in a factory pattern', () => {
    doNotExecute(() => {
      const mutations = {
        create: () =>
          mutationOptions({
            mutationKey: ['items', 'create'] as const,
            mutationFn: (input: { name: string }) =>
              Promise.resolve({ id: 1, name: input.name }),
          }),
        delete: () =>
          mutationOptions({
            mutationKey: ['items', 'delete'] as const,
            mutationFn: (_id: number) => Promise.resolve(undefined),
          }),
      }

      const createResult = useMutation(mutations.create())
      expectTypeOf(createResult.data).toEqualTypeOf<
        { id: number; name: string } | undefined
      >()

      const deleteResult = useMutation(mutations.delete())
      expectTypeOf(deleteResult.data).toEqualTypeOf<undefined>()
    })
  })

  it('should work with queryClient mutation cache filters', () => {
    doNotExecute(async () => {
      const queryClient = useQueryClient()
      const options = mutationOptions({
        mutationKey: ['key'] as const,
        mutationFn: () => Promise.resolve('data'),
      })

      queryClient.getMutationCache().findAll({
        mutationKey: options.mutationKey,
      })
    })
  })

  it('should infer types when used with queryClient.isMutating', () => {
    doNotExecute(() => {
      const queryClient = new QueryClient()

      const isMutating = queryClient.isMutating({
        mutationKey: mutationOptions({
          mutationKey: ['key'],
          mutationFn: () => Promise.resolve(5),
        }).mutationKey,
      })
      expectTypeOf(isMutating).toEqualTypeOf<number>()
    })
  })

  it('should handle union type variables', () => {
    doNotExecute(() => {
      type Action =
        | { type: 'create'; payload: { name: string } }
        | { type: 'delete'; payload: { id: number } }

      const options = mutationOptions({
        mutationKey,
        mutationFn: (_action: Action) => Promise.resolve('done'),
      })

      const result = useMutation(options)
      result.mutate({ type: 'create', payload: { name: 'test' } })
      result.mutate({ type: 'delete', payload: { id: 1 } })
    })
  })

  it('should properly narrow mutationKey presence based on overload', () => {
    doNotExecute(() => {
      // With mutationKey: mutationKey is required in the return type
      const withKey = mutationOptions({
        mutationKey: ['key'] as const,
        mutationFn: () => Promise.resolve(1),
      })
      expectTypeOf(withKey.mutationKey).toMatchTypeOf<MutationKey>()

      // Without mutationKey: mutationKey should not be accessible
      const withoutKey = mutationOptions({
        mutationFn: () => Promise.resolve(1),
      })
      // @ts-expect-error mutationKey should not exist
      withoutKey.mutationKey
    })
  })

  it('should allow mutationKey to be used as MutationKey', () => {
    doNotExecute(() => {
      const options = mutationOptions({
        mutationKey: ['todos', { status: 'active' }] as const,
        mutationFn: () => Promise.resolve(true),
      })

      const key: MutationKey = options.mutationKey
      expectTypeOf(key).toMatchTypeOf<MutationKey>()
    })
  })

  it('should infer types when used with useIsMutating via mutationKey filter', () => {
    doNotExecute(() => {
      const options = mutationOptions({
        mutationKey: ['key'] as const,
        mutationFn: () => Promise.resolve(5),
      })

      // mutationKey from mutationOptions can be used in MutationFilters
      const isMutating = useIsMutating({
        mutationKey: options.mutationKey,
      })
      expectTypeOf(isMutating).toEqualTypeOf<number>()
    })
  })

  it('should infer types when used with useIsMutating passing mutationKey directly', () => {
    doNotExecute(() => {
      const options = mutationOptions({
        mutationKey: ['key'] as const,
        mutationFn: () => Promise.resolve(5),
      })

      // v4 useIsMutating accepts MutationKey as first arg
      const isMutating = useIsMutating(options.mutationKey)
      expectTypeOf(isMutating).toEqualTypeOf<number>()
    })
  })

  it('should not allow passing mutationOptions without mutationKey to useIsMutating filter', () => {
    doNotExecute(() => {
      const options = mutationOptions({
        mutationFn: () => Promise.resolve(5),
      })

      // @ts-expect-error mutationKey does not exist on options without mutationKey
      useIsMutating({ mutationKey: options.mutationKey })
    })
  })
})
