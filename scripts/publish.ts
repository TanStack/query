// Originally ported to TS from https://github.com/remix-run/react-router/tree/main/scripts/{version,publish}.js
import path from 'path'
import { execSync } from 'child_process'
import chalk from 'chalk'
import jsonfile from 'jsonfile'
import semver from 'semver'
import currentGitBranch from 'current-git-branch'
import parseCommit from '@commitlint/parse'
import log from 'git-log-parser'
import streamToArray from 'stream-to-array'
import axios from 'axios'
import { DateTime } from 'luxon'
import { branchConfigs, packages, rootDir } from './config'
import type { BranchConfig, Commit } from './types'

import type { PackageJson } from 'type-fest'

const releaseCommitMsg = (version: string) => `release: v${version}`

async function run() {
  const branchName: string = process.env.BRANCH ?? currentGitBranch()
  const isMainBranch = branchName === 'main'
  const npmTag = isMainBranch ? 'latest' : branchName

  const branchConfig: BranchConfig | undefined = branchConfigs[branchName]

  if (!branchConfig) {
    throw new Error(`No publish config found for branch: ${branchName}`)
  }

  // Get tags
  let tags: string[] = execSync('git tag').toString().split('\n')

  // Filter tags to our branch/pre-release combo
  tags = tags
    .filter((tag) => semver.valid(tag))
    .filter((tag) => {
      // If this is an older release, filter to only include that version
      if (branchConfig.previousVersion) {
        return tag.startsWith(branchName)
      }
      if (semver.prerelease(tag) === null) {
        return isMainBranch
      } else {
        return !isMainBranch
      }
    })
    // sort by latest
    .sort(semver.compare)

  // Get the latest tag
  let latestTag = [...tags].pop()

  let range = `${latestTag}..HEAD`
  // let range = ``;

  // If RELEASE_ALL is set via a commit subject or body, all packages will be
  // released regardless if they have changed files matching the package srcDir.
  let RELEASE_ALL = false

  if (!latestTag || process.env.TAG) {
    if (process.env.TAG) {
      if (!process.env.TAG.startsWith('v')) {
        throw new Error(
          `process.env.TAG must start with "v", eg. v0.0.0. You supplied ${process.env.TAG}`,
        )
      }
      console.info(
        chalk.yellow(
          `Tag is set to ${process.env.TAG}. This will force release all packages. Publishing...`,
        ),
      )
      RELEASE_ALL = true

      // Is it a major version?
      if (!semver.patch(process.env.TAG) && !semver.minor(process.env.TAG)) {
        range = `beta..HEAD`
        latestTag = process.env.TAG
      }
    } else {
      throw new Error(
        'Could not find latest tag! To make a release tag of v0.0.1, run with TAG=v0.0.1',
      )
    }
  }

  console.info(`Git Range: ${range}`)

  // Get the commits since the latest tag
  const commitsSinceLatestTag = (
    await new Promise<Commit[]>((resolve, reject) => {
      const strm = log.parse({
        _: range,
      })

      streamToArray(strm, function (err: any, arr: any[]) {
        if (err) return reject(err)

        Promise.all(
          arr.map(async (d) => {
            const parsed = await parseCommit(d.subject)

            return { ...d, parsed }
          }),
        ).then((res) => resolve(res.filter(Boolean)))
      })
    })
  ).filter((commit: Commit) => {
    const exclude = [
      commit.subject.startsWith('Merge branch '), // No merge commits
      commit.subject.startsWith(releaseCommitMsg('')), // No example update commits
    ].some(Boolean)

    return !exclude
  })

  console.info(
    `Parsing ${commitsSinceLatestTag.length} commits since ${latestTag}...`,
  )

  // Pares the commit messsages, log them, and determine the type of release needed
  let recommendedReleaseLevel: number = commitsSinceLatestTag.reduce(
    (releaseLevel, commit) => {
      if (commit.parsed.type) {
        if (['fix', 'refactor', 'perf'].includes(commit.parsed.type!)) {
          releaseLevel = Math.max(releaseLevel, 0)
        }
        if (['feat'].includes(commit.parsed.type!)) {
          releaseLevel = Math.max(releaseLevel, 1)
        }
        if (commit.body.includes('BREAKING CHANGE')) {
          releaseLevel = Math.max(releaseLevel, 2)
        }
        if (
          commit.subject.includes('RELEASE_ALL') ||
          commit.body.includes('RELEASE_ALL')
        ) {
          RELEASE_ALL = true
        }
      }

      return releaseLevel
    },
    -1,
  )

  const changedFiles: string[] = process.env.TAG
    ? []
    : execSync(`git diff ${latestTag} --name-only`)
        .toString()
        .split('\n')
        .filter(Boolean)

  const changedPackages = RELEASE_ALL
    ? packages
    : packages.filter((pkg) => {
        const changed = changedFiles.some(
          (file) =>
            file.startsWith(path.join('packages', pkg.packageDir, 'src')) ||
            file.startsWith(
              path.join('packages', pkg.packageDir, 'package.json'),
            ),
        )
        return changed
      })

  // If a package has a dependency that has been updated, we need to update the
  // package that depends on it as well.
  // run this multiple times so that dependencies of dependencies are also included
  // changes to query-core affect query-persist-client-core, which affects react-query-persist-client and then indirectly the sync/async persisters
  for (let runs = 0; runs < 3; runs++) {
    for (const pkg of packages) {
      const packageJson = await readPackageJson(
        path.resolve(rootDir, 'packages', pkg.packageDir, 'package.json'),
      )
      const allDependencies = Object.keys(
        Object.assign(
          {},
          packageJson.dependencies ?? {},
          packageJson.peerDependencies ?? {},
        ),
      )

      if (
        allDependencies.find((dep) =>
          changedPackages.find((d) => d.name === dep),
        ) &&
        !changedPackages.find((d) => d.name === pkg.name)
      ) {
        console.info(
          'adding package dependency',
          pkg.name,
          'to changed packages',
        )
        changedPackages.push(pkg)
      }
    }
  }

  if (!process.env.TAG) {
    if (recommendedReleaseLevel === 2) {
      console.info(
        `Major versions releases must be tagged and released manually.`,
      )
      return
    }

    if (recommendedReleaseLevel === -1) {
      console.info(
        `There have been no changes since the release of ${latestTag} that require a new version. You're good!`,
      )
      return
    }
  }

  const changelogCommitsMd = process.env.TAG
    ? `Manual Release: ${process.env.TAG}`
    : await Promise.all(
        Object.entries(
          commitsSinceLatestTag.reduce((acc, next) => {
            const type = next.parsed.type?.toLowerCase() ?? 'other'

            return {
              ...acc,
              [type]: [...(acc[type] || []), next],
            }
          }, {} as Record<string, Commit[]>),
        )
          .sort(
            getSorterFn([
              ([d]) =>
                [
                  'other',
                  'examples',
                  'docs',
                  'chore',
                  'refactor',
                  'perf',
                  'fix',
                  'feat',
                ].indexOf(d),
            ]),
          )
          .reverse()
          .map(async ([type, commits]) => {
            return Promise.all(
              commits.map(async (commit) => {
                let username = ''

                if (process.env.GH_TOKEN) {
                  const query = `${
                    commit.author.email || commit.committer.email
                  }`

                  const res = await axios.get(
                    'https://api.github.com/search/users',
                    {
                      params: {
                        q: query,
                      },
                      headers: {
                        Authorization: `token ${process.env.GH_TOKEN}`,
                      },
                    },
                  )

                  username = res.data.items[0]?.login
                }

                const scope = commit.parsed.scope
                  ? `${commit.parsed.scope}: `
                  : ''
                const subject = commit.parsed.subject || commit.subject

                return `- ${scope}${subject} (${commit.commit.short}) ${
                  username
                    ? `by @${username}`
                    : `by ${commit.author.name || commit.author.email}`
                }`
              }),
            ).then((c) => [type, c] as const)
          }),
      ).then((groups) => {
        return groups
          .map(([type, commits]) => {
            return [`### ${capitalize(type)}`, commits.join('\n')].join('\n\n')
          })
          .join('\n\n')
      })

  if (process.env.TAG && recommendedReleaseLevel === -1) {
    recommendedReleaseLevel = 0
  }

  const releaseType = branchConfig.prerelease
    ? 'prerelease'
    : ({ 0: 'patch', 1: 'minor', 2: 'major' } as const)[recommendedReleaseLevel]

  if (!releaseType) {
    throw new Error(`Invalid release level: ${recommendedReleaseLevel}`)
  }

  const version = process.env.TAG
    ? semver.parse(process.env.TAG)?.version
    : semver.inc(latestTag!, releaseType, npmTag)

  if (!version) {
    throw new Error(
      `Invalid version increment from semver.inc(${[
        latestTag,
        recommendedReleaseLevel,
        branchConfig.prerelease,
      ].join(', ')}`,
    )
  }

  const changelogMd = [
    `Version ${version} - ${DateTime.now().toLocaleString(
      DateTime.DATETIME_SHORT,
    )}`,
    `## Changes`,
    changelogCommitsMd,
    `## Packages`,
    changedPackages.map((d) => `- ${d.name}@${version}`).join('\n'),
  ].join('\n\n')

  console.info('Generating changelog...')
  console.info()
  console.info(changelogMd)
  console.info()

  if (changedPackages.length === 0) {
    console.info('No packages have been affected.')
    return
  }

  console.info('Building packages...')
  execSync(`pnpm run build --skip-nx-cache`, {
    encoding: 'utf8',
    stdio: 'inherit',
  })
  console.info('')

  console.info('Validating packages...')
  execSync(`pnpm run validatePackages`, { encoding: 'utf8', stdio: 'inherit' })

  console.info(`Updating all changed packages to version ${version}...`)
  // Update each package to the new version
  for (const pkg of changedPackages) {
    console.info(`  Updating ${pkg.name} version to ${version}...`)

    await updatePackageJson(
      path.resolve(rootDir, 'packages', pkg.packageDir, 'package.json'),
      (config) => {
        config.version = version
      },
    )
  }

  if (!process.env.CI) {
    console.warn(
      `This is a dry run for version ${version}. Push to CI to publish for real or set CI=true to override!`,
    )
    return
  }

  console.info()
  console.info(`Publishing all packages to npm with tag "${npmTag}"`)

  // Publish each package
  changedPackages.forEach((pkg) => {
    const packageDir = path.join(rootDir, 'packages', pkg.packageDir)

    const cmd = `cd ${packageDir} && pnpm publish --tag ${
      // check v4, v5, v6, v7..., and if it's false, then it's a tag for npm (ex. latest, beta, alpha, rc)
      /^v\d+$/.test(npmTag) ? `query-${npmTag}` : npmTag
    } --access=public --no-git-checks`
    console.info(`  Publishing ${pkg.name}@${version} to npm...`)
    execSync(cmd, {
      stdio: [process.stdin, process.stdout, process.stderr],
    })
  })

  console.info()

  console.info(`Committing changes...`)
  execSync(`git add -A && git commit -m "${releaseCommitMsg(version)}"`)
  console.info()
  console.info(`  Committed Changes.`)

  console.info(`Pushing changes...`)
  execSync(`git push`)
  console.info()
  console.info(`  Changes pushed.`)

  console.info(`Creating new git tag v${version}`)
  execSync(`git tag -a -m "v${version}" v${version}`)

  console.info(`Pushing tags...`)
  execSync(`git push --tags`)
  console.info()
  console.info(`  Tags pushed.`)

  console.info(`Creating github release...`)
  // Stringify the markdown to excape any quotes
  execSync(
    `gh release create v${version} ${
      branchConfig.prerelease ? '--prerelease' : ''
    } --notes '${changelogMd.replace(/'/g, '"')}'`,
  )
  console.info(`  Github release created.`)

  console.info(`All done!`)
}

run().catch((err) => {
  console.info(err)
  process.exit(1)
})

function capitalize(str: string) {
  return str.slice(0, 1).toUpperCase() + str.slice(1)
}

async function readPackageJson(pathName: string) {
  return (await jsonfile.readFile(pathName)) as PackageJson
}

async function updatePackageJson(
  pathName: string,
  transform: (json: PackageJson) => Promise<void> | void,
) {
  const json = await readPackageJson(pathName)
  await transform(json)
  await jsonfile.writeFile(pathName, json, {
    spaces: 2,
  })
}

function getSorterFn<TItem>(sorters: ((d: TItem) => any)[]) {
  return (a: TItem, b: TItem) => {
    let i = 0

    sorters.some((sorter) => {
      const sortedA = sorter(a)
      const sortedB = sorter(b)
      if (sortedA > sortedB) {
        i = 1
        return true
      }
      if (sortedA < sortedB) {
        i = -1
        return true
      }
      return false
    })

    return i
  }
}
