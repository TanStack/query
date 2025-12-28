# Contributing

## Questions

If you have questions about implementation details, help or support, then please use our dedicated community forum at [GitHub Discussions](https://github.com/TanStack/query/discussions) **PLEASE NOTE:** If you choose to instead open an issue for your question, your issue will be immediately closed and redirected to the forum.

## Reporting Issues

If you have found what you think is a bug, please [file an issue](https://github.com/TanStack/query/issues/new/choose). **PLEASE NOTE:** Issues that are identified as implementation questions or non-issues will be immediately closed and redirected to [GitHub Discussions](https://github.com/TanStack/query/discussions)

## Suggesting new features

If you are here to suggest a feature, first create an issue if it does not already exist. From there, we will discuss use-cases for the feature and then finally discuss how it could be implemented.

## Development

_TanStack/query uses **symlink-based** configuration files. For smooth development in a local environment, we recommend developing in an environment that supports symlinks(ex: Linux, macOS, Windows Subsystem for Linux / WSL)._

If you have been assigned to fix an issue or develop a new feature, please follow these steps to get started:

- Fork this repository.
- Install dependencies

  ```bash
  pnpm install
  ```

  - We use [pnpm](https://pnpm.io/) v10 for package management (run in case of pnpm-related issues).

    ```bash
    corepack enable && corepack prepare
    ```

  - We use [nvm](https://github.com/nvm-sh/nvm) to manage node versions - please make sure to use the version mentioned in `.nvmrc`

    ```bash
    nvm use
    ```

- Build all packages.

  ```bash
  pnpm build:all
  ```

- Run development server.

  ```bash
  pnpm run watch
  ```

- Implement your changes and tests to files in the `src/` directory and corresponding test files.
- Document your changes in the appropriate doc page.
- Git stage your required changes and commit (see below commit guidelines).
- Submit PR for review.

### Editing the docs locally and previewing the changes

The documentations for all the TanStack projects are hosted on [tanstack.com](https://tanstack.com), which is a TanStack Start application (https://github.com/TanStack/tanstack.com). You need to run this app locally to preview your changes in the `TanStack/query` docs.

> [!NOTE]
> The website fetches the doc pages from GitHub in production, and searches for them at `../query/docs` in development. Your local clone of `TanStack/query` needs to be in the same directory as the local clone of `TanStack/tanstack.com`.

You can follow these steps to set up the docs for local development:

1. Make a new directory called `tanstack`.

```sh
mkdir tanstack
```

2. Enter that directory and clone the [`TanStack/query`](https://github.com/TanStack/query) and [`TanStack/tanstack.com`](https://github.com/TanStack/tanstack.com) repos.

```sh
cd tanstack
git clone git@github.com:TanStack/query.git
# We probably don't need all the branches and commit history
# from the `tanstack.com` repo, so let's just create a shallow
# clone of the latest version of the `main` branch.
# Read more about shallow clones here:
# https://github.blog/2020-12-21-get-up-to-speed-with-partial-clone-and-shallow-clone/#user-content-shallow-clones
git clone git@github.com:TanStack/tanstack.com.git --depth=1 --single-branch --branch=main
```

> [!NOTE]
> Your `tanstack` directory should look like this:
>
> ```
> tanstack/
>    |
>    +-- query/ (<-- this directory cannot be called anything else!)
>    |
>    +-- tanstack.com/
> ```

3. Enter the `tanstack/tanstack.com` directory, install the dependencies and run the app in dev mode:

```sh
cd tanstack.com
pnpm i
# The app will run on https://localhost:3000 by default
pnpm dev
```

4. Now you can visit http://localhost:3000/query/latest/docs/framework/react/overview in the browser and see the changes you make in `tanstack/query/docs` there.

> [!WARNING]
> You will need to update the `docs/config.json` file (in `TanStack/query`) if you add a new documentation page!

You can see the whole process in the screen capture below:

https://github.com/fulopkovacs/form/assets/43729152/9d35a3c3-8153-4e74-9cb2-af275f7a269b

### Running examples

- Make sure you've installed the dependencies in the repo's root directory.

  ```bash
  pnpm install
  ```

- If you want to run the example against your local changes, run below in the repo's root directory. Otherwise, it will be run against the latest TanStack Query release.

  ```bash
  pnpm run watch
  ```

- Run below in the selected examples' directory.

  ```bash
  pnpm run dev
  ```

#### Note on standalone execution

If you want to run an example without installing dependencies for the whole repo, just follow the instructions from the example's README.md file. It will then be run against the latest TanStack Query release.

## Online one-click setup

You can use Gitpod (An Online open-source VS Code-like IDE that is free for Open Source) for developing online. With a single click it will start a workspace and automatically:

- clone the `TanStack/query` repo.
- install all the dependencies in `/` and `/docs`.
- run below in the root(`/`) to Auto-build files.

  ```bash
  npm start
  ```

- run below in `/docs`.

  ```bash
  npm run dev
  ```

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/TanStack/query)

## Changesets

This repo uses [Changesets](https://github.com/changesets/changesets) to automate releases. If your PR should release a new package version (patch, minor, or major), please run run `pnpm changeset` and commit the file. If needed, changeset descriptions can be more descriptive, and will be included in the changelog. If your PR affects docs, examples, styles, etc., you probably don't need to generate a changeset.

## Pull requests

Maintainers merge pull requests by squashing all commits and editing the commit message if necessary using the GitHub user interface.

Use an appropriate commit type. Be especially careful with breaking changes.

## Releases

For each new commit added to `main`, a GitHub Workflow is triggered which runs the [Changesets Action](https://github.com/changesets/action). This generates a preview PR showing the impact of all changesets. When this PR is merged, the package will be published to NPM.

## 🧪 Test

TanStack Query uses [Nx](https://nx.dev/) as its monorepo tool.
To run tests in a local environment, you should use `nx` commands from the root directory.

### ✅ Run all tests

To run tests for **all packages**, run:

```bash
npm run test
```

### ✅ Run tests for a specific package

To run tests for a specific package, use the following command:

```bash
npx nx run @tanstack/{package-name}:test:lib
```

For example:

```bash
npx nx run @tanstack/react-query:test:lib
```

### ⚠️ Caution

Do not run `pnpm run test:lib` inside individual package folders.
This can cause test failures due to dependencies between packages.
Always run tests from the **root folder** using `nx` commands.
