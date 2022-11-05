import { ESLintUtils } from '@typescript-eslint/utils'
import { normalizeIndent } from '../../utils/test-utils'
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
              queryKey: ["foo", dep1],
              queryFn: () => api.get<Result>(dep),
            });
        }
      `,
    },
  ],
  invalid: [
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
        const id = 1;
        useQuery({ queryKey: ["entity"], queryFn: () => api.getEntity(id) });
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
                const id = 1;
                useQuery({ queryKey: ["entity", id], queryFn: () => api.getEntity(id) });
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when no deps are passed (solid)',
      code: normalizeIndent`
        const id = 1;
        createQuery({ queryKey: ["entity"], queryFn: () => api.getEntity(id) });
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
                const id = 1;
                createQuery({ queryKey: ["entity", id], queryFn: () => api.getEntity(id) });
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when deps are passed incorrectly',
      code: normalizeIndent`
        const id = 1;
        useQuery({ queryKey: ["entity/\${id}"], queryFn: () => api.getEntity(id) });
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
                const id = 1;
                useQuery({ queryKey: ["entity/\${id}", id], queryFn: () => api.getEntity(id) });
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should pass missing dep while key has a template literal',
      code: normalizeIndent`
        const a = 1;
        const b = 2;
        useQuery({ queryKey: [\`entity/\${a}\`], queryFn: () => api.getEntity(a, b) });
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
                const a = 1;
                const b = 2;
                useQuery({ queryKey: [\`entity/\${a}\`, b], queryFn: () => api.getEntity(a, b) });
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when dep exists inside setter and missing in queryKey',
      code: normalizeIndent`
        const [id] = React.useState(1);
        useQuery({
            queryKey: ["entity"],
            queryFn: () => {
                const { data } = axios.get(\`.../\${id}\`);
                return data;
            }
        });
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
                const [id] = React.useState(1);
                useQuery({
                    queryKey: ["entity", id],
                    queryFn: () => {
                        const { data } = axios.get(\`.../\${id}\`);
                        return data;
                    }
                });
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
  ],
})
