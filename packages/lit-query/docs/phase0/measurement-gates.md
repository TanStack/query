# Measurement Gates (Phase 0 -> Phase 4)

Last updated: 2026-03-05

These gates define pass/fail criteria for pilot readiness.

## Gate Table

| Gate                                           | Threshold                 | Procedure                                                   | Runtime/Browser                   | Sample Size                            | Baseline Method                                               | Latest Measurement                |
| ---------------------------------------------- | ------------------------- | ----------------------------------------------------------- | --------------------------------- | -------------------------------------- | ------------------------------------------------------------- | --------------------------------- |
| Bundle delta (gzip)                            | `<= 1 KB` entrypoint gzip | `npm run measure:bundle` and read `entryJsGzipBytes`        | Node `v24.12.0`                   | 1 build artifact per release candidate | Compare against previous release candidate artifact           | `305 B` (`PASS`) on 2026-03-05    |
| Retained observers/listeners after 1000 cycles | `0`                       | `npm run perf:l3` and read `retainedObserversAfterRun`      | Node `v24.12.0`                   | 1000 connect/disconnect cycles         | Compare to pre-run cache observer baseline (expected 0)       | `0` (`PASS`) on 2026-03-05        |
| Memory growth after 1000 cycles                | `<= 10 MB`                | `npm run perf:l3` and read `memoryGrowthMb`                 | Node `v24.12.0`                   | 1000 connect/disconnect cycles         | Compare `finalHeapMb - initialHeapMb`                         | `4.374 MB` (`PASS`) on 2026-03-05 |
| Duplicate request delta vs baseline            | `<= 5%`                   | Execute `SN-03` in ServiceNow staging                       | ServiceNow staging browser matrix | 3 pilot flows x 3 runs each            | Compare migrated flow request count vs pre-migration baseline | `PENDING`                         |
| Observer-update p95 latency                    | `<= 20 ms`                | Run perf harness and compute p95 observer->render latency   | Node + target browser in staging  | 200 update events per scenario         | Compare against same scenario baseline before migration       | `PENDING`                         |
| Pilot error-rate delta vs baseline             | `<= 1%`                   | Execute canary flow and compare adapter-attributable errors | ServiceNow staging/prod canary    | 10% -> 25% -> 50% rollout windows      | Compare adapter-attributable error rate vs baseline window    | `PENDING`                         |

## Notes

1. `measure:bundle` and `perf:l3` are local repeatable gates for pre-pilot quality checks.
2. `SN-03` and pilot error-rate require ServiceNow environment telemetry in Phase 4; latency p95 is a release-frequency gate completed in Phase 5 (`PERF-05`).
