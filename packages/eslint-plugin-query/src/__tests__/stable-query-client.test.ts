import { RuleTester } from '@typescript-eslint/rule-tester'
import { rule } from '../rules/stable-query-client/stable-query-client.rule'
import { normalizeIndent } from './test-utils'

const ruleTester = new RuleTester({
  parser: '@typescript-eslint/parser',
  settings: {},
})

ruleTester.run('stable-query-client', rule, {
  valid: [
    {
      name: 'QueryClient is stable when wrapped in React.useState',
      code: normalizeIndent`
        import { QueryClient } from "@tanstack/react-query";

        function Component() {
          const [queryClient] = React.useState(() => new QueryClient());
          return;
        }
      `,
    },
    {
      name: 'QueryClient is stable when wrapped in useState',
      code: normalizeIndent`
        import { QueryClient } from "@tanstack/react-query";

        function Component() {
          const [queryClient] = useState(() => new QueryClient());
          return;
        }
      `,
    },
    {
      name: 'QueryClient is stable when wrapped in React.useMemo',
      code: normalizeIndent`
          import { QueryClient } from "@tanstack/react-query";
  
          function Component() {
            const [queryClient] = React.useMemo(() => new QueryClient(), []);
            return;
          }
        `,
    },
    {
      name: 'QueryClient is stable when wrapped in useAnything',
      code: normalizeIndent`
          import { QueryClient } from "@tanstack/react-query";
  
          function Component() {
            const [queryClient] = useAnything(() => new QueryClient());
            return;
          }
        `,
    },
    {
      name: 'QueryClient is imported from a non-tanstack package',
      code: normalizeIndent`
        import { QueryClient } from "other-library";

        function Component() {
          const queryClient = new QueryClient();
          return;
        }
      `,
    },
    {
      name: 'QueryClient is not imported from @tanstack/react-query',
      code: normalizeIndent`
        import { QueryClient } from "@tanstack/solid-query";

        function Component() {
          const queryClient = new QueryClient();
          return;
        }
      `,
    },
    {
      name: 'QueryClient is invoked outside of a function',
      code: normalizeIndent`
        import { QueryClient } from "@tanstack/solid-query";

        const queryClient = new QueryClient();

        function Component() {
          return;
        }
      `,
    },
    {
      name: 'QueryClient is invoked in a non-component function',
      code: normalizeIndent`
        import { QueryClient } from "@tanstack/solid-query";

        function someFn() {
          const queryClient = new QueryClient();
          return;
        }
      `,
    },
    {
      name: 'QueryClient is invoked in an async (react server) component',
      code: normalizeIndent`
        import { QueryClient } from "@tanstack/solid-query";

        async function AsyncComponent() {
          const queryClient = new QueryClient();
          return;
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'QueryClient is not stable when it is not wrapped in React.useState in component',
      code: normalizeIndent`
        import { QueryClient } from "@tanstack/react-query";

        function Component() {
          const queryClient = new QueryClient();
          return;
        }
      `,
      output: normalizeIndent`
        import { QueryClient } from "@tanstack/react-query";

        function Component() {
          const [queryClient] = React.useState(() => new QueryClient());
          return;
        }
      `,
      errors: [{ messageId: 'unstable' }],
    },
    {
      name: 'QueryClient is not stable when it is not wrapped in React.useState in custom hook',
      code: normalizeIndent`
        import { QueryClient } from "@tanstack/react-query";

        function useHook() {
          const queryClient = new QueryClient();
          return;
        }
      `,
      output: normalizeIndent`
        import { QueryClient } from "@tanstack/react-query";

        function useHook() {
          const [queryClient] = React.useState(() => new QueryClient());
          return;
        }
      `,
      errors: [{ messageId: 'unstable' }],
    },
    {
      name: 'preserve QueryClient options',
      code: normalizeIndent`
        import { QueryClient } from "@tanstack/react-query";

        function Component() {
          const queryClient = new QueryClient({ defaultOptions: { /* */ } });
          return;
        }
      `,
      output: normalizeIndent`
        import { QueryClient } from "@tanstack/react-query";

        function Component() {
          const [queryClient] = React.useState(() => new QueryClient({ defaultOptions: { /* */ } }));
          return;
        }
      `,
      errors: [{ messageId: 'unstable' }],
    },
    {
      name: 'preserve QueryClient variable declarator name',
      code: normalizeIndent`
        import { QueryClient } from "@tanstack/react-query";

        function Component() {
          const customName = new QueryClient();
          return;
        }
      `,
      output: normalizeIndent`
        import { QueryClient } from "@tanstack/react-query";

        function Component() {
          const [customName] = React.useState(() => new QueryClient());
          return;
        }
      `,
      errors: [{ messageId: 'unstable' }],
    },
  ],
})
