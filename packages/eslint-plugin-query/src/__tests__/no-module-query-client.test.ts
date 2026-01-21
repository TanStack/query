import { RuleTester } from '@typescript-eslint/rule-tester'
import { rule } from '../rules/no-module-query-client/no-module-query-client.rule'
import { normalizeIndent } from './test-utils'

const ruleTester = new RuleTester()

ruleTester.run('no-module-query-client', rule, {
  valid: [
    {
      name: 'QueryClient created with React.useState in _app.tsx',
      filename: 'pages/_app.tsx',
      code: normalizeIndent`
        import { QueryClient } from "@tanstack/react-query";
        import React from "react";

        export default function MyApp({ Component, pageProps }) {
          const [queryClient] = React.useState(() => new QueryClient());
          return null;
        }
      `,
    },
    {
      name: 'QueryClient created with useState in _app.tsx',
      filename: 'pages/_app.tsx',
      code: normalizeIndent`
        import { QueryClient } from "@tanstack/react-query";
        import { useState } from "react";

        export default function MyApp({ Component, pageProps }) {
          const [queryClient] = useState(() => new QueryClient());
          return null;
        }
      `,
    },
    {
      name: 'QueryClient created with React.useRef in pages directory',
      filename: 'pages/_app.tsx',
      code: normalizeIndent`
        import { QueryClient } from "@tanstack/react-query";
        import React from "react";

        export default function MyApp({ Component, pageProps }) {
          const queryClient = React.useRef(new QueryClient());
          return null;
        }
      `,
    },
    {
      name: 'QueryClient created in app directory with useState',
      filename: 'app/layout.tsx',
      code: normalizeIndent`
        'use client';
        import { QueryClient } from "@tanstack/react-query";
        import { useState } from "react";

        export default function RootLayout({ children }) {
          const [queryClient] = useState(() => new QueryClient());
          return null;
        }
      `,
    },
    {
      name: 'QueryClient from different package at module level',
      filename: 'pages/_app.tsx',
      code: normalizeIndent`
        import { QueryClient } from "some-other-package";

        const queryClient = new QueryClient();

        export default function MyApp() {
          return null;
        }
      `,
    },
    {
      name: 'QueryClient at module level in non-Next.js file',
      filename: 'src/utils/query.ts',
      code: normalizeIndent`
        import { QueryClient } from "@tanstack/react-query";

        const queryClient = new QueryClient();

        export { queryClient };
      `,
    },
    {
      name: 'QueryClient at module level in directory containing "app" as substring',
      filename: 'myapp/components/Provider.tsx',
      code: normalizeIndent`
        import { QueryClient } from "@tanstack/react-query";

        const queryClient = new QueryClient();

        export { queryClient };
      `,
    },
    {
      name: 'QueryClient in custom hook',
      filename: 'pages/custom-hook.ts',
      code: normalizeIndent`
        import { QueryClient } from "@tanstack/react-query";
        import { useState } from "react";

        export function useQueryClient() {
          const [queryClient] = useState(() => new QueryClient());
          return queryClient;
        }
      `,
    },
    {
      name: 'QueryClient from solid-query at module level in pages',
      filename: 'pages/_app.tsx',
      code: normalizeIndent`
        import { QueryClient } from "@tanstack/solid-query";

        const queryClient = new QueryClient();

        export default function MyApp() {
          return null;
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'QueryClient created at module level in _app.tsx',
      filename: 'pages/_app.tsx',
      code: normalizeIndent`
        import { QueryClient } from "@tanstack/react-query";

        const queryClient = new QueryClient();

        export default function MyApp({ Component, pageProps }) {
          return null;
        }
      `,
      errors: [
        {
          messageId: 'noModuleQueryClient',
        },
      ],
    },
    {
      name: 'QueryClient created at module level in _document.tsx',
      filename: 'pages/_document.tsx',
      code: normalizeIndent`
        import { QueryClient } from "@tanstack/react-query";

        const queryClient = new QueryClient();

        export default function Document() {
          return null;
        }
      `,
      errors: [
        {
          messageId: 'noModuleQueryClient',
        },
      ],
    },
    {
      name: 'QueryClient created at module level in app directory',
      filename: 'app/layout.tsx',
      code: normalizeIndent`
        'use client';
        import { QueryClient } from "@tanstack/react-query";

        const queryClient = new QueryClient();

        export default function RootLayout({ children }) {
          return null;
        }
      `,
      errors: [
        {
          messageId: 'noModuleQueryClient',
        },
      ],
    },
    {
      name: 'QueryClient created in pages directory page',
      filename: 'pages/index.tsx',
      code: normalizeIndent`
        import { QueryClient } from "@tanstack/react-query";

        const queryClient = new QueryClient();

        export default function HomePage() {
          return null;
        }
      `,
      errors: [
        {
          messageId: 'noModuleQueryClient',
        },
      ],
    },
    {
      name: 'QueryClient created in app router page',
      filename: 'app/dashboard/page.tsx',
      code: normalizeIndent`
        'use client';
        import { QueryClient } from "@tanstack/react-query";

        const client = new QueryClient();

        export default function Dashboard() {
          return null;
        }
      `,
      errors: [
        {
          messageId: 'noModuleQueryClient',
        },
      ],
    },
  ],
})
