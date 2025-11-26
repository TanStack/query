#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

interface PublishedPackage {
  name: string
  version: string
}

interface PRInfo {
  number: number
  packages: Array<{ name: string; pkgPath: string; version: string }>
}

/**
 * Parse CHANGELOG.md to extract PR numbers from the latest version entry
 */
function extractPRsFromChangelog(
  changelogPath: string,
  version: string,
): Array<number> {
  try {
    const content = readFileSync(changelogPath, 'utf-8')
    const lines = content.split('\n')

    let inTargetVersion = false
    let foundVersion = false
    const prNumbers = new Set<number>()

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Check for version header (e.g., "## 0.21.0")
      if (line.startsWith('## ')) {
        const versionMatch = line.match(/^## (\d+\.\d+\.\d+)/)
        if (versionMatch) {
          if (versionMatch[1] === version) {
            inTargetVersion = true
            foundVersion = true
          } else if (inTargetVersion) {
            // We've moved to the next version, stop processing
            break
          }
        }
      }

      // Extract PR numbers from links like [#302](https://github.com/TanStack/config/pull/302)
      if (inTargetVersion) {
        const prMatches = line.matchAll(
          /\[#(\d+)\]\(https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+\)/g,
        )
        for (const match of prMatches) {
          prNumbers.add(parseInt(match[1], 10))
        }
      }
    }

    if (!foundVersion) {
      console.warn(
        `Warning: Could not find version ${version} in ${changelogPath}`,
      )
    }

    return Array.from(prNumbers)
  } catch (error) {
    console.error(`Error reading changelog at ${changelogPath}:`, error)
    return []
  }
}

/**
 * Group PRs by their numbers and collect all packages they contributed to
 */
function groupPRsByNumber(
  publishedPackages: Array<PublishedPackage>,
): Map<number, PRInfo> {
  const prMap = new Map<number, PRInfo>()

  for (const pkg of publishedPackages) {
    const pkgPath = `packages/${pkg.name.replace('@tanstack/', '')}`
    const changelogPath = resolve(process.cwd(), pkgPath, 'CHANGELOG.md')

    const prNumbers = extractPRsFromChangelog(changelogPath, pkg.version)

    for (const prNumber of prNumbers) {
      if (!prMap.has(prNumber)) {
        prMap.set(prNumber, { number: prNumber, packages: [] })
      }
      prMap.get(prNumber)!.packages.push({
        name: pkg.name,
        pkgPath: pkgPath,
        version: pkg.version,
      })
    }
  }

  return prMap
}

/**
 * Post a comment on a GitHub PR using gh CLI
 */
async function commentOnPR(pr: PRInfo, repository: string): Promise<void> {
  const { number, packages } = pr

  // Build the comment body
  let comment = `🎉 This PR has been released!\n\n`

  for (const pkg of packages) {
    // Link to the package's changelog and version anchor
    const changelogUrl = `https://github.com/${repository}/blob/main/${pkg.pkgPath}/CHANGELOG.md#${pkg.version.replaceAll('.', '')}`
    comment += `- [${pkg.name}@${pkg.version}](${changelogUrl})\n`
  }

  comment += `\nThank you for your contribution!`

  try {
    // Use gh CLI to post the comment
    execSync(`gh pr comment ${number} --body '${comment.replace(/'/g, '"')}'`, {
      stdio: 'inherit',
    })
    console.log(`✓ Commented on PR #${number}`)
  } catch (error) {
    console.error(`✗ Failed to comment on PR #${number}:`, error)
  }
}

/**
 * Main function
 */
async function main() {
  // Read published packages from environment variable (set by GitHub Actions)
  const publishedPackagesJson = process.env.PUBLISHED_PACKAGES
  const repository = process.env.REPOSITORY

  if (!publishedPackagesJson) {
    console.log('No packages were published. Skipping PR comments.')
    return
  }

  if (!repository) {
    console.log('Repository is missing. Skipping PR comments.')
    return
  }

  let publishedPackages: Array<PublishedPackage>
  try {
    publishedPackages = JSON.parse(publishedPackagesJson)
  } catch (error) {
    console.error('Failed to parse PUBLISHED_PACKAGES:', error)
    process.exit(1)
  }

  if (publishedPackages.length === 0) {
    console.log('No packages were published. Skipping PR comments.')
    return
  }

  console.log(`Processing ${publishedPackages.length} published package(s)...`)

  // Group PRs by number
  const prMap = groupPRsByNumber(publishedPackages)

  if (prMap.size === 0) {
    console.log('No PRs found in CHANGELOGs. Nothing to comment on.')
    return
  }

  console.log(`Found ${prMap.size} PR(s) to comment on...`)

  // Comment on each PR
  for (const pr of prMap.values()) {
    await commentOnPR(pr, repository)
  }

  console.log('✓ Done!')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
