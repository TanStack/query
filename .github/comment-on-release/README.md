# Comment on Release Action

A reusable GitHub Action that automatically comments on PRs when they are included in a release.

## What It Does

When packages are published via Changesets:

1. Parses each published package's CHANGELOG to find PR numbers in the latest version
2. Groups PRs by number (handling cases where one PR affects multiple packages)
3. Posts a comment on each PR with release info and CHANGELOG links

## Example Comment

```
🎉 This PR has been released!

- [@tanstack/query-core@5.0.0](https://github.com/TanStack/query/blob/main/packages/query-core/CHANGELOG.md#500)
- [@tanstack/react-query@5.0.0](https://github.com/TanStack/query/blob/main/packages/react-query/CHANGELOG.md#500)

Thank you for your contribution!
```

## Usage

Add this step to your `.github/workflows/release.yml` file after the `changesets/action` step:

```yaml
- name: Run Changesets (version or publish)
  id: changesets
  uses: changesets/action@v1.5.3
  with:
    version: pnpm run changeset:version
    publish: pnpm run changeset:publish
    commit: 'ci: Version Packages'
    title: 'ci: Version Packages'
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

- name: Comment on PRs about release
  if: steps.changesets.outputs.published == 'true'
  uses: tanstack/config/.github/comment-on-release@main
  with:
    published-packages: ${{ steps.changesets.outputs.publishedPackages }}
```

## Requirements

- Must be using [Changesets](https://github.com/changesets/changesets) for releases
- CHANGELOGs must include PR links in the format: `[#123](https://github.com/org/repo/pull/123)`
- Requires `pull-requests: write` permission in the workflow
- The `gh` CLI must be available (automatically available in GitHub Actions)

## Inputs

| Input                | Required | Description                                                        |
| -------------------- | -------- | ------------------------------------------------------------------ |
| `published-packages` | Yes      | JSON string of published packages from `changesets/action` outputs |

## How It Works

The action:

1. Receives the list of published packages from the Changesets action
2. For each package, reads its CHANGELOG at `packages/{package-name}/CHANGELOG.md`
3. Extracts PR numbers from the latest version section using regex
4. Groups all PRs and tracks which packages they contributed to
5. Posts a single comment per PR listing all packages it was released in
6. Uses the `gh` CLI to post comments via the GitHub API

## Troubleshooting

**No comments are posted:**

- Verify your CHANGELOGs have PR links in the correct format
- Check that `steps.changesets.outputs.published` is `true`
- Ensure the workflow has `pull-requests: write` permission

**Script fails to find CHANGELOGs:**

- The script expects packages at `packages/{package-name}/CHANGELOG.md`
- Package name should match after removing the scope (e.g., `@tanstack/query-core` → `query-core`)
