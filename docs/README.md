# React Query Docs

This is source code to react-query.tanstack.com. It is forked from the [Formik](https://formik.org) docs and is built with:

- Next.js
- MDX
- Tailwind
- Algolia
- Notion

## Running locally

```sh
yarn install
```

At the moment, you need to signup for Notion, and [follow these instructions](https://github.com/ijjk/notion-blog#getting-blog-index-and-token) to get a token and create a blog in order to develop locally. Not ideal, but hopefully will fix soon.

With tokens and page index in hand, rename `.sample.env` and `.sample.env.build` to just `.env` and `.env.build`. In each one, add respective parameters:

```diff
-NOTION_TOKEN=XXXX
+NOTION_TOKEN=<YOUR_TOKEN>
-BLOG_INDEX_ID=XXXXX
+BLOG_INDEX_ID=<YOUR_BLOG_INDEX_ID>
```

Now it will work. Run `yarn dev` to get going.

If you get stuck or need help, [send a DM to Jared](https://twitter.com/jaredpalmer) on Twitter.
