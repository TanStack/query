# Agent Instructions

Before analyzing or changing this repository, read and follow
[`CONTRIBUTING.md`](./CONTRIBUTING.md), [`AI_POLICY.md`](./AI_POLICY.md), and the
[pull request template](./.github/pull_request_template.md). Their requirements
apply to AI-assisted contributions. The contributor must understand and verify
every submitted change and communicate in their own voice.

## Establish the problem

- Describe the application sequence and the observable failure before fixing a
  bug. Use a user report, a reproduction, or a realistic application flow.
  An unusual internal state alone does not justify more code.
- Check whether the behavior is supported, already fixed, or addressed by an
  existing issue or pull request. Follow the contribution guide before proposing
  a new feature.
- Keep each change focused on one topic. Assess unrelated findings separately.

## Choose the smallest correct change

- Trace the failure to its cause. Check existing state and behavior before adding
  fields, helpers, wrappers, overloads, or dependencies.
- Keep framework-specific corrections in the affected adapter when possible.
  Do not broaden core types or runtime behavior to accommodate one adapter.
  Explain why a core change is necessary when a local correction cannot work.
- Read relevant tests and previous fixes before changing behavior. Preserve
  intentional behavior and compatibility. Identify breaking behavior changes
  even when the public signatures stay the same.
- Add compatibility code only for a demonstrated requirement within the
  supported environments. Do not add fallbacks for hypothetical callers.
- Verify automated review findings against the code and the application path.
  Determine whether each finding is a regression, a pre-existing limitation, or
  a separate feature request before expanding the change.

## Prove bug fixes

- Include a regression test for each claimed fix. The same test must fail on
  current upstream `main` because of the defect and pass with the fix.
- Test observable behavior. For type fixes, test the public type behavior with
  the repository's type-test tools.
- Control the conditions that trigger the defect. Confirm that the selected
  tests actually execute. A setup failure, an invalid import, or an unrelated
  timeout is not regression evidence.
- Keep the baseline test independent of the fix. Transfer only the regression
  test and necessary test fixtures, without production changes.
- Use the commands and checks in the contribution guide. Record any missing
  verification instead of claiming that the fix is verified.

## Assess bundle cost

- Consider runtime work, dependencies, and bundle growth against the demonstrated
  benefit. Minimize the cost for applications that do not use the affected
  feature. Check imports and tree shaking when changing shared code.
- Report the available Size limit comparison from the current PR's Preview CI.
  Include byte and percentage changes for each measured entry when available,
  even when the check passes. Identify the compression mode when reported.
- State when a measurement is pending or unavailable. Do not treat a missing
  measurement as zero or apply one adapter's measurement to other adapters.
  A passing size limit does not by itself justify the increase.

## Check related adapters

- Trace shared behavior through the adapters that exist in the checkout.
  Inspect React and Preact together when either adapter changes.
- Check corresponding behavior, public types, JSDoc, and tests in the affected
  adapters. Preserve differences justified by each framework's model. Do not
  copy implementations solely to make the files match.

## Document and report the result

- Update source JSDoc for changed public APIs and behavior. Cover defaults,
  return values, restrictions, and relevant framework differences.
- Follow the contribution guide for guide pages, generated reference pages,
  changesets, and required checks. Keep those requirements in their existing
  documents rather than duplicating them here.
- Report what changed, why it changed, and what was verified. Distinguish checks
  for the current code from older results. State pending, failed, or unavailable
  checks explicitly.
