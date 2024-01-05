import { ESLintUtils } from '@typescript-eslint/utils'
import { normalizeIndent } from '../../utils/test-utils'
import { name, rule } from './no-deprecated-options.rule'

const ruleTester = new ESLintUtils.RuleTester({
  parser: '@typescript-eslint/parser',
  settings: {},
})

ruleTester.run(name, rule, {
  valid: [
    {
      code: normalizeIndent`
        useQuery()
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery();
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery({ queryKey, queryFn, enabled });
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        const result = useQuery({ queryKey, queryFn, enabled });
      `,
    },
    {
      code: normalizeIndent`
        import { createQuery } from "@tanstack/solid-query";
        const result = createQuery({ queryKey, queryFn, enabled });
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "somewhere-else";
        useQuery(queryKey, queryFn, { enabled });
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        const getPosts = async () => Promise.resolve([]);
        const postsQuery = { queryKey: ["posts"], queryFn: () => getPosts() };
        const usePosts = () => useQuery(postsQuery);
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        const getQuery = () => ({ queryKey: ['foo'], queryFn: () => Promise.resolve(5) })
        useQuery(getQuery())
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        const getQuery = () => {
          return { queryKey: ['foo'], queryFn: () => Promise.resolve(5) };
        }
        useQuery(getQuery())
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        const getQuery = () => {
          const queryKey = () => ['foo'];
          const queryFn = () => {
            return Promise.resolve(5);
          }
          return { queryKey, queryFn };
        }
        useQuery(getQuery())
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        const getQuery = () => {
          try {
            return { queryKey: ['foo'], queryFn: () => Promise.resolve(5) };  
          } finally {
            return { queryKey: ['foo'], queryFn: () => Promise.resolve(5) };
          }
        }
        useQuery(getQuery())
      `,
    },
    {
      code: normalizeIndent`
        useMutation()
      `,
    },
    {
      code: normalizeIndent`
        import { useMutation } from "@tanstack/react-query";
        useMutation();
      `,
    },
    {
      code: normalizeIndent`
        import { useMutation } from "@tanstack/react-query";
        useMutation({ mutationKey, mutationFn, enabled });
      `,
    },
    {
      code: normalizeIndent`
        import { useMutation } from "@tanstack/react-query";
        const result = useMutation({ mutationKey, mutationFn, enabled });
      `,
    },
    {
      code: normalizeIndent`
        import { createMutation } from "@tanstack/solid-query";
        const result = createMutation({ mutationKey, mutationFn, enabled });
      `,
    },
    {
      code: normalizeIndent`
        import { useMutation } from "somewhere-else";
        useMutation(mutationKey, mutationFn, { enabled });
      `,
    },
    {
      code: normalizeIndent`
        import { useMutation } from "@tanstack/react-query";
        const getPosts = async () => Promise.resolve([]);
        const postsQuery = { mutationKey: ["posts"], mutationFn: () => getPosts() };
        const usePosts = () => useMutation(postsQuery);
      `,
    },
  ],

  invalid: [
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery({ queryKey, queryFn, enabled, onSuccess: () => {} });
      `,
      errors: [{ messageId: 'noDeprecatedOptions' }],
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery({ queryKey, queryFn, enabled, onError: () => {} });
      `,
      errors: [{ messageId: 'noDeprecatedOptions' }],
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery({ queryKey, queryFn, enabled, onSettled: () => {} });
      `,
      errors: [{ messageId: 'noDeprecatedOptions' }],
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery({ queryKey, queryFn, enabled, isDataEqual: () => {} });
      `,
      errors: [{ messageId: 'noDeprecatedOptions' }],
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery(queryKey, queryFn, { enabled, onSuccess: () => {} });
      `,
      errors: [{ messageId: 'noDeprecatedOptions' }],
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        const getQuery = () => ({ queryKey: ['foo'], onSuccess: () => {} })
        useQuery(getQuery())
      `,
      errors: [{ messageId: 'noDeprecatedOptions' }],
    },

    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery(['data'], () => fetchData(), { enabled: false, onSuccess: () => {} });
      `,
      errors: [{ messageId: 'noDeprecatedOptions' }],
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery(queryKey, { queryFn, enabled, onSuccess: () => {} });
      `,
      errors: [{ messageId: 'noDeprecatedOptions' }],
    },

    {
      code: normalizeIndent`
      import { useQuery } from "@tanstack/react-query";
      const getQuery = (x) => {
        try {
          return { queryKey: "foo", queryFn: () => Promise.resolve(1), onSuccess: () => {} };
        } catch (e) {
          if (x > 1) {
            return { queryKey: "bar", queryFn: () => Promise.resolve(2) };
          } else {
            return null;
          }
        }
      };
      useQuery(getQuery(x));
      `,
      errors: [{ messageId: 'noDeprecatedOptions' }],
    },
    {
      code: normalizeIndent`
      import { useQuery } from "@tanstack/react-query";
      const getQuery = (x) => {
        switch (x) {
          case 1:
            return { queryKey: "foo", queryFn: () => Promise.resolve(1), onSuccess: () => {} };
          default:
            return null;
        }
      };
      useQuery(getQuery(x));
      `,
      errors: [{ messageId: 'noDeprecatedOptions' }],
    },
    {
      code: normalizeIndent`
      import { useQuery } from "@tanstack/react-query";
      const getQuery = (x, y) => {
        if (x) {
          return { queryKey: "foo", queryFn: () => Promise.resolve(1), onSuccess: () => {}, onError: () => {} };
        } else {
          if (y) {
            return { queryKey: "bar", queryFn: () => Promise.resolve(2) };
          } else {
            return () => Promise.resolve(3);
          }
        }
      };
      useQuery(getQuery(x));
      `,
      errors: [
        {
          messageId: 'noDeprecatedOptions',
          data: { option: 'onSuccess' },
        },
        {
          messageId: 'noDeprecatedOptions',
          data: { option: 'onError' },
        },
      ],
    },
  ],
})
