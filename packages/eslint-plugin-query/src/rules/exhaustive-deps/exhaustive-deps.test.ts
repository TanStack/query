import { ESLintUtils } from '@typescript-eslint/utils'
import { rule } from './exhaustive-deps.rule'

const ruleTester = new ESLintUtils.RuleTester({
  parser: '@typescript-eslint/parser',
  settings: {},
})

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
      // eslint-disable-next-line no-template-curly-in-string
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
      name: 'should pass props.src',
      code: `
        function MyComponent(props) {
            useQuery({ queryKey: ["entity", props.src], queryFn: () => api.entity.get(props.src) });
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
  ],
  invalid: [
    {
      name: 'should fail when deps are missing in query factory',
      code: `
        const todoQueries = {
          list: () => ({ queryKey: ['entity'], queryFn: fetchEntities }),
          detail: (id) => ({ queryKey: ['entity'], queryFn: () => fetchEntity(id) })
        }
        `,
      output: `
        const todoQueries = {
          list: () => ({ queryKey: ['entity'], queryFn: fetchEntities }),
          detail: (id) => ({ queryKey: ['entity', id], queryFn: () => fetchEntity(id) })
        }
        `,
      errors: [{ messageId: 'missingDeps', data: { deps: 'id' } }],
    },
    {
      name: 'should fail when no deps are passed (react)',
      code: `
        const id = 1;
        useQuery({ queryKey: ["entity"], queryFn: () => api.getEntity(id) });
      `,
      output: `
        const id = 1;
        useQuery({ queryKey: ["entity", id], queryFn: () => api.getEntity(id) });
      `,
      errors: [{ messageId: 'missingDeps', data: { deps: 'id' } }],
    },
    {
      name: 'should fail when no deps are passed (solid)',
      code: `
        const id = 1;
        createQuery({ queryKey: ["entity"], queryFn: () => api.getEntity(id) });
      `,
      output: `
        const id = 1;
        createQuery({ queryKey: ["entity", id], queryFn: () => api.getEntity(id) });
      `,
      errors: [{ messageId: 'missingDeps', data: { deps: 'id' } }],
    },
    {
      name: 'should fail when deps are passed incorrectly',
      code: `
        const id = 1;
        useQuery({ queryKey: ["entity/\${id}"], queryFn: () => api.getEntity(id) });
      `,
      output: `
        const id = 1;
        useQuery({ queryKey: ["entity/\${id}", id], queryFn: () => api.getEntity(id) });
      `,
      errors: [{ messageId: 'missingDeps', data: { deps: 'id' } }],
    },
    {
      name: 'should pass missing dep while key has a template literal',
      code: `
        const a = 1;
        const b = 2;
        useQuery({ queryKey: [\`entity/\${a}\`], queryFn: () => api.getEntity(a, b) });
      `,
      output: `
        const a = 1;
        const b = 2;
        useQuery({ queryKey: [\`entity/\${a}\`, b], queryFn: () => api.getEntity(a, b) });
      `,
      errors: [{ messageId: 'missingDeps', data: { deps: 'b' } }],
    },
    {
      name: 'should fail when dep exists inside setter and missing in queryKey',
      code: `
        const [id] = React.useState(1);
        useQuery({
            queryKey: ["entity"],
            queryFn: () => {
                const { data } = axios.get(\`.../\${id}\`);
                return data;
            }
        });
      `,
      output: `
        const [id] = React.useState(1);
        useQuery({
            queryKey: ["entity", id],
            queryFn: () => {
                const { data } = axios.get(\`.../\${id}\`);
                return data;
            }
        });
      `,
      errors: [{ messageId: 'missingDeps', data: { deps: 'id' } }],
    },
    {
      name: 'should fail when dep does not exist while having a complex queryKey',
      code: `
        const todoQueries = {
          key: (a, b, c, d, e) => ({
            queryKey: ["entity", a, [b], { c }, 1, true],
            queryFn: () => api.getEntity(a, b, c, d, e)
          })
        }
      `,
      output: `
        const todoQueries = {
          key: (a, b, c, d, e) => ({
            queryKey: ["entity", a, [b], { c }, 1, true, d, e],
            queryFn: () => api.getEntity(a, b, c, d, e)
          })
        }
      `,
      errors: [{ messageId: 'missingDeps', data: { deps: 'd, e' } }],
    },
    {
      name: 'should fail when dep does not exist while having a complex queryKey #2',
      code: `
        const todoQueries = {
          key: (dep1, dep2, dep3, dep4, dep5, dep6, dep7, dep8) => ({
            queryKey: ['foo', {dep1, dep2: dep2, bar: dep3, baz: [dep4, dep5]}, [dep6, dep7]],
            queryFn: () => api.getEntity(dep1, dep2, dep3, dep4, dep5, dep6, dep7, dep8),
          }),
        };
      `,
      output: `
        const todoQueries = {
          key: (dep1, dep2, dep3, dep4, dep5, dep6, dep7, dep8) => ({
            queryKey: ['foo', {dep1, dep2: dep2, bar: dep3, baz: [dep4, dep5]}, [dep6, dep7], dep8],
            queryFn: () => api.getEntity(dep1, dep2, dep3, dep4, dep5, dep6, dep7, dep8),
          }),
        };
      `,
      errors: [{ messageId: 'missingDeps', data: { deps: 'dep8' } }],
    },
    {
      name: 'should fail when two deps that depend on each other are missing',
      code: `
          function Component({ map, key }) {
            useQuery({ queryKey: ["key"], queryFn: () => api.get(map[key]) });
          }
        `,
      output: `
          function Component({ map, key }) {
            useQuery({ queryKey: ["key", map[key]], queryFn: () => api.get(map[key]) });
          }
        `,
      errors: [{ messageId: 'missingDeps', data: { deps: 'map[key]' } }],
    },
  ],
})
