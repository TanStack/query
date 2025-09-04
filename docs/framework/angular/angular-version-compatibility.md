---
id: angular-version-compatibility
title: Angular Version Compatibility
---

The TanStack Query Angular adapter's dependency range will specify at least the oldest Angular version under active or LTS support.

```json
{
  "peerDependencies": {
    "@angular/common": ">=16.0.0",
    "@angular/core": ">=16.0.0"
  }
}
```

As of the time of writing, Angular 18 is the oldest version under LTS support but there has not been a reason yet to remove support for Angular 16.

Support for older versions not under LTS support will be dropped from the adapter's dependency range when supporting both the older- and more recent versions becomes impractical. Bugs that only affect Angular versions not under LTS support will in principle not be fixed.

## Pre-Release Versions of Angular

As only the minimum version and not a maximum version of Angular is specified, pre-release versions of Angular are not excluded but are not guaranteed to work.
