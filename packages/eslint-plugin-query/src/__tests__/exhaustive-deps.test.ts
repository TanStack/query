import { RuleTester } from '@typescript-eslint/rule-tester'
import { rule } from '../rules/exhaustive-deps/exhaustive-deps.rule'
import { normalizeIndent } from './test-utils'

const ruleTester = new RuleTester()

ruleTester.run('exhaustive-deps', rule, {
  valid: [
    {
      name: 'should pass when deps are passed in array (react)',
      code: 'useQuery({ queryKey: ["todos"], queryFn: fetchTodos });',
    },
    {
      name: 'should pass when deps are passed in array (solid)',
      code: 'createQuery({ queryKey: ["todos"], queryFn: fetchTodos });',
    },
    {
      name: 'should pass when deps are passed in array',
      code: 'useQuery({ queryKey: ["entity", id], queryFn: () => api.getEntity(id) });',
    },
    {
      name: 'should pass when deps are passed in template literal',
      code: 'useQuery({ queryKey: [`entity/${id}`], queryFn: () => api.getEntity(id) });',
    },
    {
      name: 'should not pass fetch',
      code: 'useQuery({ queryKey: ["entity", id], queryFn: () => fetch(id) });',
    },
    {
      name: 'should not pass axios.get',
      code: 'useQuery({ queryKey: ["entity", id], queryFn: () => axios.get(id) });',
    },
    {
      name: 'should not pass api.entity.get',
      code: 'useQuery({ queryKey: ["entity", id], queryFn: () => api.entity.get(id) });',
    },
    {
      name: 'should pass api when its member is being invoked',
      code: `
        import useApi from './useApi'

        const useFoo = () => {
          const api = useApi();
          return useQuery({
            queryKey: ['foo', api],
            queryFn: () => api.fetchFoo(),
          })
        }
      `,
    },
    {
      name: 'should pass props.src',
      code: `
        function MyComponent(props) {
            useQuery({ queryKey: ["entity", props.src], queryFn: () => api.entity.get(props.src) });
        }
      `,
    },
    {
      name: 'identify !!props.id (unary expression)',
      code: `
        function MyComponent(props) {
            useQuery({ queryKey: ["entity", !!props.id], queryFn: () => api.entity.get(props.id) });
        }
      `,
    },
    {
      name: 'identify props?.id (chain expression)',
      code: `
        function MyComponent(props) {
            useQuery({ queryKey: ["entity", props?.id], queryFn: () => api.entity.get(props?.id) });
        }
      `,
    },
    {
      name: 'identify props!.id (ts non null expression)',
      code: `
        function MyComponent(props) {
            useQuery({ queryKey: ["entity", props!.id], queryFn: () => api.entity.get(props!.id) });
        }
      `,
    },
    {
      name: 'should ignore keys from callback',
      code: `
        function MyComponent(props) {
            useQuery({
              queryKey: ["foo", dep1],
              queryFn: ({ queryKey: [, dep] }) => fetch(dep),
            });
        }
      `,
    },
    {
      name: 'should ignore type identifiers',
      code: `
        type Result = {};
        function MyComponent(props) {
            useQuery({
              queryKey: ["foo", dep],
              queryFn: () => api.get<Result>(dep),
            });
        }
      `,
    },
    {
      name: 'should ignore type parameters used only in queryFn return type',
      code: normalizeIndent`
        function useThing<TData>() {
          return useQuery({
            queryKey: ['thing'],
            queryFn: (): Promise<TData> => Promise.reject(new Error('nope')),
          })
        }
      `,
    },
    {
      name: 'should add "...args" to deps',
      code: `
        function foo(...args) {}
        function useData(arg, ...args) {
          return useQuery({
            queryKey: ['foo', arg, ...args],
            queryFn: async () => foo([arg, ...args])
          });
        }
      `,
    },
    {
      name: 'should not add class to deps',
      code: `
        class Foo {}
        useQuery({ queryKey: ['foo'], queryFn: async () => new Foo() });
      `,
    },
    {
      name: 'should not add `undefined` to deps',
      code: `
        useQuery({
          queryKey: [],
          queryFn: async () => {
            if (undefined) {
              return null;
            }
            return 1
          },
        });
      `,
    },
    {
      name: 'should not fail when queryKey is a queryKeyFactory while having a dep as first arg',
      code: normalizeIndent`
        const fooQueryKeyFactory = {
          foo: () => ['foo'] as const,
          num: (num: number) => [...fooQueryKeyFactory.foo(), num] as const,
        }

        const useFoo = (num: number) =>
          useQuery({
            queryKey: fooQueryKeyFactory.foo(num),
            queryFn: () => Promise.resolve(num),
          })
      `,
    },
    {
      name: 'should not fail when queryKey is a queryKeyFactory while having a dep in object',
      code: normalizeIndent`
        const fooQueryKeyFactory = {
          foo: () => ['foo'] as const,
          num: (num: number) => [...fooQueryKeyFactory.foo(), num] as const,
        }

        const useFoo = (num: number) =>
          useQuery({
            queryKey: fooQueryKeyFactory.foo({ x: num }),
            queryFn: () => Promise.resolve(num),
          })
      `,
    },
    {
      name: 'should not fail when queryKey is a queryKeyFactory while having a dep in object 2',
      code: normalizeIndent`
        const fooQueryKeyFactory = {
          foo: () => ['foo'] as const,
          num: (num: number) => [...fooQueryKeyFactory.foo(), num] as const,
        }

        const useFoo = (num: number) =>
          useQuery({
            queryKey: fooQueryKeyFactory.foo({ num }),
            queryFn: () => Promise.resolve(num),
          })
      `,
    },
    {
      name: 'should not fail when queryKey is a queryKeyFactory while having a dep in array',
      code: normalizeIndent`
        const fooQueryKeyFactory = {
          foo: () => ['foo'] as const,
          num: (num: number) => [...fooQueryKeyFactory.foo(), num] as const,
        }

        const useFoo = (num: number) =>
          useQuery({
              queryKey: fooQueryKeyFactory.foo([num]),
              queryFn: () => Promise.resolve(num),
          })
      `,
    },
    {
      name: 'should not fail when queryKey is a queryKeyFactory while having a dep in second arg',
      code: normalizeIndent`
        const fooQueryKeyFactory = {
          foo: () => ['foo'] as const,
          num: (num: number) => [...fooQueryKeyFactory.foo(), num] as const,
        }

        const useFoo = (num: number) =>
          useQuery({
              queryKey: fooQueryKeyFactory.foo(1, num),
              queryFn: () => Promise.resolve(num),
          })
      `,
    },
    {
      name: 'should not fail when queryKey is a queryKeyFactory while having a dep is object prop',
      code: normalizeIndent`
        const fooQueryKeyFactory = {
          foo: () => ['foo'] as const,
          num: (num: number) => [...fooQueryKeyFactory.foo(), num] as const,
        }

        const useFoo = (obj: { num: number }) =>
          useQuery({
              queryKey: fooQueryKeyFactory.foo(obj.num),
              queryFn: () => Promise.resolve(obj.num),
          })
      `,
    },
    {
      name: 'should pass with queryKeyFactory result assigned to a variable',
      code: `
        function fooQueryKeyFactory(dep: string) {
            return ["foo", dep];
        }

        const useFoo = (dep: string) => {
          const queryKey = fooQueryKeyFactory(dep);
          return useQuery({
              queryKey,
              queryFn: () => Promise.resolve(dep),
            })
          }
      `,
    },
    {
      name: 'should pass with queryKeyFactory result assigned to a variable 2',
      code: `
        function fooQueryKeyFactory(dep: string) {
            const x = ["foo", dep] as const;
            return x as const;
        }

        const useFoo = (dep: string) => {
          const queryKey = fooQueryKeyFactory(dep);
          return useQuery({
              queryKey,
              queryFn: () => Promise.resolve(dep),
            })
          }
      `,
    },
    {
      name: 'should pass when queryKey is a chained queryKeyFactory while having deps in nested calls',
      code: normalizeIndent`
        const fooQueryKeyFactory = {
          foo: (num: number) => ({
            detail: (flag: boolean) => ['foo', num, flag] as const,
          }),
        }

        const useFoo = (num: number, flag: boolean) =>
          useQuery({
            queryKey: fooQueryKeyFactory.foo(num).detail(flag),
            queryFn: () => Promise.resolve({ num, flag }),
          })
      `,
    },
    {
      name: 'should not treat new Error as missing dependency',
      code: normalizeIndent`
        useQuery({
          queryKey: ['foo'],
          queryFn: () => Promise.reject(new Error('1')),
        })
      `,
    },
    {
      name: 'should see id when there is a const assertion',
      code: normalizeIndent`
        const useX = (id: number) => {
          return useQuery({
            queryKey: ['foo', id] as const,
            queryFn: async () => id,
          })
        }
      `,
    },
    {
      name: 'should see id when there is a const assertion of a variable dereference',
      code: normalizeIndent`
        const useX = (id: number) => {
          const queryKey = ['foo', id]
          return useQuery({
            queryKey: queryKey as const,
            queryFn: async () => id,
          })
        }
      `,
    },
    {
      name: 'should see id when there is a const assertion assigned to a variable',
      code: normalizeIndent`
        const useX = (id: number) => {
          const queryKey = ['foo', id] as const
          return useQuery({
            queryKey,
            queryFn: async () => id,
          })
        }
      `,
    },
    {
      name: 'should not fail if queryKey is having the whole object while queryFn uses some props of it',
      code: normalizeIndent`
        const state = { foo: 'foo', bar: 'bar' }

        useQuery({
            queryKey: ['state', state],
            queryFn: () => Promise.resolve({ foo: state.foo, bar: state.bar })
        })
      `,
    },
    {
      name: 'should not fail if queryKey does not include an internal dependency',
      code: normalizeIndent`
        useQuery({
          queryKey: ["api"],
          queryFn: async () => {
            const response = Promise.resolve([]);
            const data = await response.json();
            return data[0].name;
          },
        });
      `,
    },
    {
      name: 'should ignore constants defined out of scope (react component, function declaration)',
      code: `
        const CONST_VAL = 1
        function MyComponent() {
          useQuery({
            queryKey: ["foo"],
            queryFn: () => CONST_VAL
          });
        }
      `,
    },
    {
      name: 'should ignore constants defined out of scope (react component, function expression)',
      code: `
        const CONST_VAL = 1
        const MyComponent = () => {
          useQuery({
            queryKey: ["foo"],
            queryFn: () => CONST_VAL
          });
        }
      `,
    },
    {
      name: 'should ignore constants defined out of scope (react component, anonymous function)',
      code: `
        const CONST_VAL = 1
        const MyComponent = function () {
          useQuery({
            queryKey: ["foo"],
            queryFn: () => CONST_VAL
          });
        }
      `,
    },
    {
      name: 'should ignore constants defined out of scope (non react component/hook function)',
      code: `
          const CONST_VAL = 1
          function fn() {
            return {
              queryKey: ["foo"],
              queryFn: () => CONST_VAL
            }
          }
        `,
    },
    {
      name: 'should ignore constants defined out of scope (react hook, function declaration)',
      code: `
        const CONST_VAL = 1
        function useHook() {
          useQuery({
            queryKey: ["foo"],
            queryFn: () => CONST_VAL
          });
        }
      `,
    },
    {
      name: 'should ignore constants defined out of scope (react hook, function expression)',
      code: `
        const CONST_VAL = 1
        const useHook = () => {
          useQuery({
            queryKey: ["foo"],
            queryFn: () => CONST_VAL
          });
        }
      `,
    },
    {
      name: 'should ignore constants defined out of scope (react hook, anonymous function)',
      code: `
        const CONST_VAL = 1
        const useHook = function () {
          useQuery({
            queryKey: ["foo"],
            queryFn: () => CONST_VAL
          });
        }
      `,
    },
    {
      name: 'query key with nullish coalescing operator',
      code: `
        const factory = (id: number) => ['foo', id];
        function Component({ id }) {
          useQuery({
            queryKey: factory(id ?? -1),
            queryFn: () => Promise.resolve({ id })
          });
        }
        `,
    },
    {
      name: 'should pass when queryKey uses a direct conditional expression',
      code: normalizeIndent`
        function Component({ cond, a, b }) {
          useQuery({
            queryKey: ['thing', cond ? a : b],
            queryFn: () => (cond ? a : b),
          })
        }
      `,
    },
    {
      name: 'should pass when queryKey uses a direct binary expression',
      code: normalizeIndent`
        function Component({ a, b }) {
          useQuery({
            queryKey: ['thing', a + b],
            queryFn: () => a + b,
          })
        }
      `,
    },
    {
      name: 'should pass when queryKey uses a nested type assertion',
      code: normalizeIndent`
        function Component(dep) {
          useQuery({
            queryKey: ['thing', dep as string],
            queryFn: () => dep,
          })
        }
      `,
    },
    {
      name: 'should pass when queryKey derives values inside a callback',
      code: normalizeIndent`
        function Component(ids, prefix) {
          useQuery({
            queryKey: ['thing', ids.map((id) => prefix + '-' + id)],
            queryFn: () => ({ ids, prefix }),
          })
        }
      `,
    },
    {
      name: 'instanceof value should not be in query key',
      code: `
        class SomeClass {}

        function Component({ value }) {
            useQuery({
                queryKey: ['foo', value],
                queryFn: () => {
                    return value instanceof SomeClass;
                }
            });
        }
        `,
    },
    {
      name: 'queryFn as a ternary expression with dep and a skipToken',
      code: normalizeIndent`
        import { useQuery, skipToken } from "@tanstack/react-query";
        const fetch = true

        function Component({ id }) {
          useQuery({
              queryKey: [id],
              queryFn: fetch ? () => Promise.resolve(id) : skipToken
          })
        }
      `,
    },
    {
      name: 'should not fail when queryFn uses nullish coalescing operator',
      code: normalizeIndent`
        useQuery({
          queryKey: ["foo", options],
          queryFn: () => options?.params ?? options
        });
      `,
    },
    {
      name: 'should not fail when queryKey uses arrow function to produce a key',
      code: normalizeIndent`
      const obj = reactive<{ boo?: string }>({});

      const query = useQuery({
        queryKey: ['foo', () => obj.boo],
        queryFn: () => fetch(\`/mock/getSomething/\${obj.boo}\`),
        enable: () => !!obj.boo,
      });
      `,
    },
    {
      name: 'should not fail when queryKey uses arrow function to produce a key as the body return',
      code: normalizeIndent`
      const obj = reactive<{ boo?: string }>({});

      const query = useQuery({
        queryKey: ['foo', () => { return obj.boo }],
        queryFn: () => fetch(\`/mock/getSomething/\${obj.boo}\`),
        enable: () => !!obj.boo,
      });
      `,
    },
    {
      name: 'should not fail when queryKey uses function expression to produce a key as the body return',
      code: normalizeIndent`
      const obj = reactive<{ boo?: string }>({});

      const query = useQuery({
        queryKey: ['foo', function() {
          return obj.boo
        }],
        queryFn: () => fetch(\`/mock/getSomething/\${obj.boo}\`),
        enable: () => !!obj.boo,
      });
      `,
    },
    {
      name: 'should not fail when queryFn inside queryOptions contains a reference to an external variable',
      code: normalizeIndent`
      const EXTERNAL = 1;

      export const queries = {
        foo: queryOptions({
          queryKey: ['foo'],
          queryFn: () => Promise.resolve(EXTERNAL),
        }),
      };
      `,
    },
    {
      name: 'should pass with optional chaining as key',
      code: `
        function useTest(data?: any) {
          return useQuery({
            queryKey: ['query-name', data?.address],
            queryFn: async () => sendQuery(data.address),
            enabled: !!data?.address,
          })
        }
      `,
    },
    {
      name: 'should pass with optional chaining as key and non-null assertion in queryFn',
      code: `
        function useTest(data?: any) {
          return useQuery({
            queryKey: ['query-name', data?.address],
            queryFn: async () => sendQuery(data!.address),
            enabled: !!data?.address,
          })
        }
      `,
    },
    {
      name: 'should pass with optional chaining as key and non-null assertion at the end of the variable in queryFn',
      code: `
        function useTest(data?: any) {
          return useQuery({
            queryKey: ['query-name', data?.address],
            queryFn: async () => sendQuery(data!.address!),
            enabled: !!data?.address,
          })
        }
      `,
    },
    {
      name: 'should pass in Vue file when deps are correctly included (script setup)',
      filename: 'Component.vue',
      code: normalizeIndent`
        import { useQuery } from '@tanstack/vue-query'

        const id = 1
        useQuery({
          queryKey: ['entity', id],
          queryFn: () => fetchEntity(id),
        })
      `,
    },
    {
      name: 'should not require imports in queryKey for Vue files',
      filename: 'Component.vue',
      code: normalizeIndent`
        import { useQuery } from '@tanstack/vue-query'
        import { fetchTodos } from './api'

        useQuery({
          queryKey: ['todos'],
          queryFn: () => fetchTodos(),
        })
      `,
    },
    {
      name: 'should not require global fetch in queryKey for Vue files',
      filename: 'Component.vue',
      code: normalizeIndent`
        import { useQuery } from '@tanstack/vue-query'

        const id = 1
        useQuery({
          queryKey: ['entity', id],
          queryFn: () => fetch('/api/entity/' + id),
        })
      `,
    },
    {
      name: 'should ignore callback locals in Vue file queryFn',
      filename: 'Component.vue',
      code: normalizeIndent`
        import { useQuery } from '@tanstack/vue-query'

        const ids = [1, 2, 3]
        useQuery({
          queryKey: ['entities', ids],
          queryFn: () => ids.map((id) => fetchEntity(id)),
        })
      `,
    },
    {
      name: 'should pass when dep used in then/catch is listed in queryKey',
      code: normalizeIndent`
        function Component() {
          const id = 1
          useQuery({
            queryKey: ['foo', id],
            queryFn: () =>
              Promise.resolve(null)
                .then(() => id)
                .catch(() => id),
          })
        }
      `,
    },
    {
      name: 'should pass when dep used in try/catch/finally is listed in queryKey',
      code: normalizeIndent`
        function Component() {
          const id = 1
          useQuery({
            queryKey: ['foo', id],
            queryFn: () => {
              try {
                return fetch(id)
              } catch (error) {
                console.error(error)
                return id
              } finally {
                console.log('done')
              }
            },
          })
        }
      `,
    },
    {
      name: 'should pass when multiple sibling member method calls covered by root',
      code: normalizeIndent`
        function useThing(a) {
          return useQuery({
            queryKey: ['thing', a],
            queryFn: () => {
              a.b.foo()
              a.c.bar()
              return 1
            }
          })
        }
      `,
    },
    {
      name: 'should pass when multiple sibling member method calls explicitly listed',
      code: normalizeIndent`
        function useThing(a) {
          return useQuery({
            queryKey: ['thing', a.b, a.c],
            queryFn: () => {
              a.b.foo()
              a.c.bar()
              return 1
            }
          })
        }
      `,
    },
    {
      name: 'should pass when single member method call covered by root',
      code: normalizeIndent`
        function useThing(a) {
          return useQuery({
            queryKey: ['thing', a],
            queryFn: () => {
              a.b.foo()
              return 1
            }
          })
        }
      `,
    },
    {
      name: 'should pass when single member method call uses member path',
      code: normalizeIndent`
        function useThing(a) {
          return useQuery({
            queryKey: ['thing', a.b],
            queryFn: () => {
              a.b.foo()
              return 1
            }
          })
        }
      `,
    },
    {
      name: 'should pass when optional chaining method call is covered by root',
      code: normalizeIndent`
        function useThing(a) {
          return useQuery({
            queryKey: ['thing', a],
            queryFn: () => a?.foo()
          })
        }
      `,
    },
    {
      name: 'should pass when queryKey uses TSAsExpression with array',
      code: normalizeIndent`
        function useThing(dep) {
          return useQuery({
            queryKey: ['thing', dep] as const,
            queryFn: () => dep
          })
        }
      `,
    },
    {
      name: 'should pass when queryKey references identifier pointing to array',
      code: normalizeIndent`
        function useThing(dep) {
          const key = ['thing', dep]
          return useQuery({
            queryKey: key,
            queryFn: () => dep
          })
        }
      `,
    },
    {
      name: 'should pass when queryKey has object with spread properties',
      code: normalizeIndent`
        function useThing(dep1, dep2) {
          return useQuery({
            queryKey: ['thing', { ...dep1, prop: dep2 }],
            queryFn: () => dep1.prop + dep2
          })
        }
      `,
    },
    {
      name: 'should pass when queryKey has call expression with member callee',
      code: normalizeIndent`
        function useThing(api) {
          return useQuery({
            queryKey: ['thing', api.createKey()],
            queryFn: () => api.fetch()
          })
        }
      `,
    },
    {
      name: 'should pass when queryKey has call expression with identifier callee',
      code: normalizeIndent`
        function useThing(dep) {
          const makeKeyPart = (value) => value

          return useQuery({
            queryKey: ['thing', makeKeyPart(dep)],
            queryFn: () => makeKeyPart(dep)
          })
        }
      `,
    },
    {
      name: 'should pass when queryKey has call expression with nested member callee',
      code: normalizeIndent`
        function useThing(obj) {
          return useQuery({
            queryKey: ['thing', obj.api.createKey()],
            queryFn: () => obj.api.fetch()
          })
        }
      `,
    },
    {
      name: 'should pass when queryFn uses conditional with skipToken',
      code: normalizeIndent`
        function useThing(condition, dep) {
          return useQuery({
            queryKey: ['thing', dep],
            queryFn: condition ? () => dep : skipToken
          })
        }
      `,
    },
    {
      name: 'should pass when queryFn uses instanceof expression',
      code: normalizeIndent`
        function useThing(value) {
          return useQuery({
            queryKey: ['thing', value],
            queryFn: () => {
              return value instanceof Date;
            }
          })
        }
      `,
    },
    {
      name: 'should pass when queryFn uses conditional with skipToken in consequent',
      code: normalizeIndent`
        function useThing(condition, dep) {
          return useQuery({
            queryKey: ['thing', dep],
            queryFn: condition ? skipToken : () => dep
          })
        }
      `,
    },
    {
      name: 'should pass when queryFn is ternary with both branches having deps in queryKey',
      code: normalizeIndent`
        function useThing(condition, a, b) {
          return useQuery({
            queryKey: ['thing', a, b],
            queryFn: condition ? () => fetchA(a) : () => fetchB(b)
          })
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'should fail when optional chaining method call is missing root',
      code: normalizeIndent`
        function useThing(a) {
          return useQuery({
            queryKey: ['thing'],
            queryFn: () => a?.foo()
          })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'a' },
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                function useThing(a) {
                  return useQuery({
                    queryKey: ['thing', a],
                    queryFn: () => a?.foo()
                  })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when non-null assertion method call is missing root',
      code: normalizeIndent`
        function useThing(a) {
          return useQuery({
            queryKey: ['thing'],
            queryFn: () => a!.foo()
          })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'a' },
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                function useThing(a) {
                  return useQuery({
                    queryKey: ['thing', a],
                    queryFn: () => a!.foo()
                  })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when alias of props used in queryFn is missing in queryKey',
      code: normalizeIndent`
        function Component(props) {
          const entities = props.entities;

          const q = useQuery({
            queryKey: ['get-stuff'],
            queryFn: () => {
              return api.fetchStuff({
                ids: entities.map((o) => o.id)
              });
            }
          });
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'entities' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: { result: "['get-stuff', entities]" },
              output: normalizeIndent`
                function Component(props) {
                  const entities = props.entities;

                  const q = useQuery({
                    queryKey: ['get-stuff', entities],
                    queryFn: () => {
                      return api.fetchStuff({
                        ids: entities.map((o) => o.id)
                      });
                    }
                  });
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when deps are missing in query factory',
      code: normalizeIndent`
        const todoQueries = {
          list: () => ({ queryKey: ['entity'], queryFn: fetchEntities }),
          detail: (id) => ({ queryKey: ['entity'], queryFn: () => fetchEntity(id) })
        }
        `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'id' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: { result: "['entity', id]" },
              output: normalizeIndent`
                const todoQueries = {
                  list: () => ({ queryKey: ['entity'], queryFn: fetchEntities }),
                  detail: (id) => ({ queryKey: ['entity', id], queryFn: () => fetchEntity(id) })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when no deps are passed (react)',
      code: normalizeIndent`
        function Component() {
          const id = 1;
          useQuery({ queryKey: ["entity"], queryFn: () => api.getEntity(id) });
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'id' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: { result: '["entity", id]' },
              output: normalizeIndent`
                function Component() {
                  const id = 1;
                  useQuery({ queryKey: ["entity", id], queryFn: () => api.getEntity(id) });
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when no deps are passed (solid)',
      code: normalizeIndent`
        function Component() {
          const id = 1;
          createQuery({ queryKey: ["entity"], queryFn: () => api.getEntity(id) });
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'id' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: { result: '["entity", id]' },
              output: normalizeIndent`
                function Component() {
                  const id = 1;
                  createQuery({ queryKey: ["entity", id], queryFn: () => api.getEntity(id) });
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when deps are passed incorrectly',
      code: normalizeIndent`
        function Component() {
          const id = 1;
          useQuery({ queryKey: ["entity/\${id}"], queryFn: () => api.getEntity(id) });
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'id' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: { result: '["entity/${id}", id]' },
              output: normalizeIndent`
                function Component() {
                  const id = 1;
                  useQuery({ queryKey: ["entity/\${id}", id], queryFn: () => api.getEntity(id) });
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should pass missing dep while key has a template literal',
      code: normalizeIndent`
        function Component() {
          const a = 1;
          const b = 2;
          useQuery({ queryKey: [\`entity/\${a}\`], queryFn: () => api.getEntity(a, b) });
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'b' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: { result: '[`entity/${a}`, b]' },
              output: normalizeIndent`
                function Component() {
                  const a = 1;
                  const b = 2;
                  useQuery({ queryKey: [\`entity/\${a}\`, b], queryFn: () => api.getEntity(a, b) });
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when dep exists inside setter and missing in queryKey',
      code: normalizeIndent`
        function Component() {
          const [id] = React.useState(1);
          useQuery({
            queryKey: ["entity"],
            queryFn: () => {
              const { data } = axios.get(\`.../\${id}\`);
              return data;
            }
          });
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'id' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: { result: '["entity", id]' },
              output: normalizeIndent`
                function Component() {
                  const [id] = React.useState(1);
                  useQuery({
                    queryKey: ["entity", id],
                    queryFn: () => {
                      const { data } = axios.get(\`.../\${id}\`);
                      return data;
                    }
                  });
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when dep does not exist while having a complex queryKey',
      code: normalizeIndent`
        const todoQueries = {
          key: (a, b, c, d, e) => ({
            queryKey: ["entity", a, [b], { c }, 1, true],
            queryFn: () => api.getEntity(a, b, c, d, e)
          })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'd, e' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: { result: '["entity", a, [b], { c }, 1, true, d, e]' },
              output: normalizeIndent`
                const todoQueries = {
                  key: (a, b, c, d, e) => ({
                    queryKey: ["entity", a, [b], { c }, 1, true, d, e],
                    queryFn: () => api.getEntity(a, b, c, d, e)
                  })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when dep does not exist while having a complex queryKey #2',
      code: normalizeIndent`
        const todoQueries = {
          key: (dep1, dep2, dep3, dep4, dep5, dep6, dep7, dep8) => ({
            queryKey: ['foo', {dep1, dep2: dep2, bar: dep3, baz: [dep4, dep5]}, [dep6, dep7]],
            queryFn: () => api.getEntity(dep1, dep2, dep3, dep4, dep5, dep6, dep7, dep8),
          }),
        };
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'dep8' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: {
                result:
                  "['foo', {dep1, dep2: dep2, bar: dep3, baz: [dep4, dep5]}, [dep6, dep7], dep8]",
              },
              output: normalizeIndent`
                const todoQueries = {
                  key: (dep1, dep2, dep3, dep4, dep5, dep6, dep7, dep8) => ({
                    queryKey: ['foo', {dep1, dep2: dep2, bar: dep3, baz: [dep4, dep5]}, [dep6, dep7], dep8],
                    queryFn: () => api.getEntity(dep1, dep2, dep3, dep4, dep5, dep6, dep7, dep8),
                  }),
                };
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when two deps that depend on each other are missing',
      code: normalizeIndent`
        function Component({ map, key }) {
          useQuery({ queryKey: ["key"], queryFn: () => api.get(map[key]) });
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'map[key]' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: {
                result: '["key", map[key]]',
              },
              output: normalizeIndent`
                function Component({ map, key }) {
                  useQuery({ queryKey: ["key", map[key]], queryFn: () => api.get(map[key]) });
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when a queryKey is a reference of an array expression with a missing dep',
      code: normalizeIndent`
        function Component() {
          const x = 5;
          const queryKey = ['foo']
          useQuery({ queryKey, queryFn: () => x })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'x' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: {
                result: "['foo', x]",
              },
              output: normalizeIndent`
                function Component() {
                  const x = 5;
                  const queryKey = ['foo', x]
                  useQuery({ queryKey, queryFn: () => x })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when queryKey is a queryKeyFactory while having missing dep',
      code: normalizeIndent`
        const fooQueryKeyFactory = { foo: () => ['foo'] as const }

        const useFoo = (num: number) =>
          useQuery({
              queryKey: fooQueryKeyFactory.foo(),
              queryFn: () => Promise.resolve(num),
          })
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'num' },
        },
      ],
    },
    {
      name: 'should fail when queryKey is a chained queryKeyFactory while having missing dep in earlier call',
      code: normalizeIndent`
        const fooQueryKeyFactory = {
          foo: (num: number) => ({
            detail: (flag: boolean) => ['foo', num, flag] as const,
          }),
        }

        const useFoo = (num: number, flag: boolean) =>
          useQuery({
            queryKey: fooQueryKeyFactory.foo(1).detail(flag),
            queryFn: () => Promise.resolve({ num, flag }),
          })
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'num' },
        },
      ],
    },
    {
      name: 'should fail if queryFn is using multiple object props when only one of them is in the queryKey',
      code: normalizeIndent`
        function Component() {
          const state = { foo: 'foo', bar: 'bar' }

          useQuery({
            queryKey: ['state', state.foo],
            queryFn: () => Promise.resolve({ foo: state.foo, bar: state.bar })
          })
        }
      `,
      errors: [
        {
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
              function Component() {
                const state = { foo: 'foo', bar: 'bar' }

                useQuery({
                  queryKey: ['state', state.foo, state.bar],
                  queryFn: () => Promise.resolve({ foo: state.foo, bar: state.bar })
                })
              }
            `,
            },
          ],
          messageId: 'missingDeps',
          data: { deps: 'state.bar' },
        },
      ],
    },
    {
      name: 'should fail if queryFn is invalid while using FunctionExpression syntax',
      code: normalizeIndent`
        function Component() {
          const id = 1;

          useQuery({
            queryKey: [],
            queryFn() {
              Promise.resolve(id)
            }
          });
        }
      `,
      errors: [
        {
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                function Component() {
                  const id = 1;

                  useQuery({
                    queryKey: [id],
                    queryFn() {
                      Promise.resolve(id)
                    }
                  });
                }
              `,
            },
          ],
          messageId: 'missingDeps',
          data: { deps: 'id' },
        },
      ],
    },
    {
      name: 'should fail if queryFn is a ternary expression with missing dep and a skipToken',
      code: normalizeIndent`
        import { useQuery, skipToken } from "@tanstack/react-query";
        const fetch = true

        function Component({ id }) {
          useQuery({
              queryKey: [],
              queryFn: fetch ? () => Promise.resolve(id) : skipToken
          })
        }
      `,
      errors: [
        {
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                import { useQuery, skipToken } from "@tanstack/react-query";
                const fetch = true

                function Component({ id }) {
                  useQuery({
                      queryKey: [id],
                      queryFn: fetch ? () => Promise.resolve(id) : skipToken
                  })
                }
              `,
            },
          ],
          messageId: 'missingDeps',
          data: { deps: 'id' },
        },
      ],
    },
    {
      name: 'should fail in Vue file when deps are missing (script setup)',
      filename: 'Component.vue',
      code: normalizeIndent`
        import { useQuery } from '@tanstack/vue-query'

        const id = 1
        useQuery({
          queryKey: ['entity'],
          queryFn: () => fetchEntity(id),
        })
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'id' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: { result: "['entity', id]" },
              output: normalizeIndent`
                import { useQuery } from '@tanstack/vue-query'

                const id = 1
                useQuery({
                  queryKey: ['entity', id],
                  queryFn: () => fetchEntity(id),
                })
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail in Vue file when multiple deps are missing',
      filename: 'Component.vue',
      code: normalizeIndent`
        import { useQuery } from '@tanstack/vue-query'

        const userId = 1
        const orgId = 2
        useQuery({
          queryKey: ['users'],
          queryFn: () => fetchUser(userId, orgId),
        })
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'userId, orgId' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: { result: "['users', userId, orgId]" },
              output: normalizeIndent`
                import { useQuery } from '@tanstack/vue-query'

                const userId = 1
                const orgId = 2
                useQuery({
                  queryKey: ['users', userId, orgId],
                  queryFn: () => fetchUser(userId, orgId),
                })
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when dep used in then/catch is missing in queryKey',
      code: normalizeIndent`
        function Component() {
          const id = 1
          useQuery({
            queryKey: ['foo'],
            queryFn: () =>
              Promise.resolve(null)
                .then(() => id)
                .catch(() => id),
          })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'id' },
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                function Component() {
                  const id = 1
                  useQuery({
                    queryKey: ['foo', id],
                    queryFn: () =>
                      Promise.resolve(null)
                        .then(() => id)
                        .catch(() => id),
                  })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when queryKey callback only references a shadowing local',
      code: normalizeIndent`
        function Component(id, ids) {
          useQuery({
            queryKey: ['thing', ids.map((id) => id)],
            queryFn: () => id,
          })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'id' },
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                function Component(id, ids) {
                  useQuery({
                    queryKey: ['thing', ids.map((id) => id), id],
                    queryFn: () => id,
                  })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when dep used in try/catch/finally is missing in queryKey',
      code: normalizeIndent`
        function Component() {
          const id = 1
          useQuery({
            queryKey: ['foo'],
            queryFn: () => {
              try {
                return fetch(id)
              } catch (error) {
                console.error(error)
                return id
              } finally {
                console.log('done')
              }
            },
          })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'id' },
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                function Component() {
                  const id = 1
                  useQuery({
                    queryKey: ['foo', id],
                    queryFn: () => {
                      try {
                        return fetch(id)
                      } catch (error) {
                        console.error(error)
                        return id
                      } finally {
                        console.log('done')
                      }
                    },
                  })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when sibling member method calls missing one path',
      code: normalizeIndent`
        function useThing(a) {
          return useQuery({
            queryKey: ['thing', a.b],
            queryFn: () => {
              a.b.foo()
              a.c.bar()
              return 1
            }
          })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'a.c' },
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                function useThing(a) {
                  return useQuery({
                    queryKey: ['thing', a.b, a.c],
                    queryFn: () => {
                      a.b.foo()
                      a.c.bar()
                      return 1
                    }
                  })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when single member method call missing path and root',
      code: normalizeIndent`
        function useThing(a) {
          return useQuery({
            queryKey: ['thing'],
            queryFn: () => {
              a.b.foo()
              return 1
            }
          })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'a.b' },
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                function useThing(a) {
                  return useQuery({
                    queryKey: ['thing', a.b],
                    queryFn: () => {
                      a.b.foo()
                      return 1
                    }
                  })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when queryKey has TSAsExpression with missing dep',
      code: normalizeIndent`
        function useThing(dep) {
          return useQuery({
            queryKey: ['thing'] as const,
            queryFn: () => dep
          })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'dep' },
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                function useThing(dep) {
                  return useQuery({
                    queryKey: ['thing', dep] as const,
                    queryFn: () => dep
                  })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when queryKey references identifier with missing dep',
      code: normalizeIndent`
        function useThing(dep) {
          const key = ['thing']
          return useQuery({
            queryKey: key,
            queryFn: () => dep
          })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'dep' },
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                function useThing(dep) {
                  const key = ['thing', dep]
                  return useQuery({
                    queryKey: key,
                    queryFn: () => dep
                  })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when type allowlist is empty',
      options: [{ allowlist: { types: [] } }],
      code: normalizeIndent`
        interface Api { fetch: () => void }
        function useThing(api: Api) {
          return useQuery({
            queryKey: ['thing'],
            queryFn: () => api.fetch()
          })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'api' },
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                interface Api { fetch: () => void }
                function useThing(api: Api) {
                  return useQuery({
                    queryKey: ['thing', api],
                    queryFn: () => api.fetch()
                  })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fix correctly when queryKey has trailing comma',
      code: normalizeIndent`
        function useThing(dep) {
          return useQuery({
            queryKey: ['thing',],
            queryFn: () => dep
          })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'dep' },
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                function useThing(dep) {
                  return useQuery({
                    queryKey: ['thing', dep],
                    queryFn: () => dep
                  })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fix correctly when queryKey is empty with whitespace',
      code: normalizeIndent`
        function useThing(dep) {
          return useQuery({
            queryKey: [ ],
            queryFn: () => dep
          })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'dep' },
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                function useThing(dep) {
                  return useQuery({
                    queryKey: [dep],
                    queryFn: () => dep
                  })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when dep in alternate branch of ternary queryFn is missing',
      code: normalizeIndent`
        function useThing(condition, a, b) {
          return useQuery({
            queryKey: ['thing', a],
            queryFn: condition ? () => fetchA(a) : () => fetchB(b)
          })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'b' },
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                function useThing(condition, a, b) {
                  return useQuery({
                    queryKey: ['thing', a, b],
                    queryFn: condition ? () => fetchA(a) : () => fetchB(b)
                  })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when dep in consequent branch of ternary queryFn is missing',
      code: normalizeIndent`
        function useThing(condition, a, b) {
          return useQuery({
            queryKey: ['thing', b],
            queryFn: condition ? () => fetchA(a) : () => fetchB(b)
          })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'a' },
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                function useThing(condition, a, b) {
                  return useQuery({
                    queryKey: ['thing', b, a],
                    queryFn: condition ? () => fetchA(a) : () => fetchB(b)
                  })
                }
              `,
            },
          ],
        },
      ],
    },
  ],
})

ruleTester.run('exhaustive-deps allowlist.types', rule, {
  valid: [
    {
      name: 'should ignore missing member path when root type is in allowlist.types',
      options: [{ allowlist: { types: ['Svc'] } }],
      code: normalizeIndent`
        interface Svc { part: { load: (id: string) => void } }
        function useThing(svc: Svc, id: string) {
          return useQuery({
            queryKey: ['thing', id],
            queryFn: () => {
              svc.part.load(id)
              return id
            }
          })
        }
      `,
    },
    {
      name: 'should ignore when TypeScript union type contains allowlisted type',
      options: [{ allowlist: { types: ['AllowedType'] } }],
      code: normalizeIndent`
        function useThing(value: AllowedType | OtherType, id: string) {
          return useQuery({
            queryKey: ['thing', id],
            queryFn: () => {
              console.log(value)
              return id
            }
          })
        }
      `,
    },
    {
      name: 'should ignore when TypeScript intersection type contains allowlisted type',
      options: [{ allowlist: { types: ['AllowedType'] } }],
      code: normalizeIndent`
        function useThing(value: AllowedType & OtherType, id: string) {
          return useQuery({
            queryKey: ['thing', id],
            queryFn: () => {
              console.log(value)
              return id
            }
          })
        }
      `,
    },
    {
      name: 'should ignore when TypeScript array type contains allowlisted type',
      options: [{ allowlist: { types: ['AllowedType'] } }],
      code: normalizeIndent`
        function useThing(value: AllowedType[], id: string) {
          return useQuery({
            queryKey: ['thing', id],
            queryFn: () => {
              console.log(value)
              return id
            }
          })
        }
      `,
    },
    {
      name: 'should ignore when TypeScript tuple type contains allowlisted type',
      options: [{ allowlist: { types: ['AllowedType'] } }],
      code: normalizeIndent`
        function useThing(value: [AllowedType, string], id: string) {
          return useQuery({
            queryKey: ['thing', id],
            queryFn: () => {
              console.log(value)
              return id
            }
          })
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'should report missing member path when root type not in allowlist.types',
      options: [{ allowlist: { types: ['Other'] } }],
      code: normalizeIndent`
        interface Svc { part: { load: (id: string) => void } }
        function useThing(svc: Svc, id: string) {
          return useQuery({
            queryKey: ['thing', id],
            queryFn: () => {
              svc.part.load(id)
              return id
            }
          })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'svc.part' },
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                interface Svc { part: { load: (id: string) => void } }
                function useThing(svc: Svc, id: string) {
                  return useQuery({
                    queryKey: ['thing', id, svc.part],
                    queryFn: () => {
                      svc.part.load(id)
                      return id
                    }
                  })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should report missing member path when variable has type annotation but type not allowlisted',
      options: [{ allowlist: { types: ['AllowedService'] } }],
      code: normalizeIndent`
        interface MyService { method: () => void }
        function useData(service: MyService) {
          return useQuery({
            queryKey: ['data'],
            queryFn: () => {
              service.method()
              return 'data'
            }
          })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'service' },
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                interface MyService { method: () => void }
                function useData(service: MyService) {
                  return useQuery({
                    queryKey: ['data', service],
                    queryFn: () => {
                      service.method()
                      return 'data'
                    }
                  })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should not inherit allowlisted type from outer shadowed binding',
      options: [{ allowlist: { types: ['AllowedService'] } }],
      code: normalizeIndent`
        interface AllowedService { load: () => void }
        interface OtherService { load: () => void }

        function useThing() {
          const svc: AllowedService = { load: () => undefined }

          if (true) {
            const svc: OtherService = { load: () => undefined }

            return useQuery({
              queryKey: ['thing'],
              queryFn: () => {
                svc.load()
                return 'data'
              }
            })
          }

          return null
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'svc' },
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                interface AllowedService { load: () => void }
                interface OtherService { load: () => void }

                function useThing() {
                  const svc: AllowedService = { load: () => undefined }

                  if (true) {
                    const svc: OtherService = { load: () => undefined }

                    return useQuery({
                      queryKey: ['thing', svc],
                      queryFn: () => {
                        svc.load()
                        return 'data'
                      }
                    })
                  }

                  return null
                }
              `,
            },
          ],
        },
      ],
    },
  ],
})

ruleTester.run('exhaustive-deps allowlist.variables', rule, {
  valid: [
    {
      name: 'should ignore missing member path when root is in allowlist.variables',
      options: [{ allowlist: { variables: ['svc'] } }],
      code: normalizeIndent`
        function useThing(svc, id) {
          return useQuery({
            queryKey: ['thing', id],
            queryFn: () => {
              svc.part.load(id)
              return id
            }
          })
        }
      `,
    },
    {
      name: 'should ignore allowlisted variable when member access spans multiple lines',
      options: [{ allowlist: { variables: ['ignored'] } }],
      code: normalizeIndent`
        function useThing() {
          const ignored = { run: () => Promise.resolve() }
          return useQuery({
            queryKey: ['thing'],
            queryFn: () => ignored
              .run()
          })
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'should only report non-allowlisted roots',
      options: [{ allowlist: { variables: ['svc'] } }],
      code: normalizeIndent`
        function useThing(svc, other) {
          return useQuery({
            queryKey: ['thing'],
            queryFn: () => {
              svc.part.load()
              other.x.run()
              return 1
            }
          })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'other.x' },
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                function useThing(svc, other) {
                  return useQuery({
                    queryKey: ['thing', other.x],
                    queryFn: () => {
                      svc.part.load()
                      other.x.run()
                      return 1
                    }
                  })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when missing member path not in allowlist.variables',
      code: normalizeIndent`
        function useThing(svc, id) {
          return useQuery({
            queryKey: ['thing', id],
            queryFn: () => {
              svc.part.load(id)
              return id
            }
          })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'svc.part' },
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                function useThing(svc, id) {
                  return useQuery({
                    queryKey: ['thing', id, svc.part],
                    queryFn: () => {
                      svc.part.load(id)
                      return id
                    }
                  })
                }
              `,
            },
          ],
        },
      ],
    },
  ],
})
