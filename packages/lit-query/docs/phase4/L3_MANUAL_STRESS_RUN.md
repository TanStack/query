# L3 Manual Stress Run

Date: 2026-03-05  
Command: `npm run perf:l3`

## Result

```json
{
  "measuredAt": "2026-03-05T17:36:08.564Z",
  "cycles": 1000,
  "elapsedMs": 24,
  "initialHeapMb": 5.029,
  "finalHeapMb": 9.404,
  "memoryGrowthMb": 4.374,
  "retainedObserversAfterRun": 0
}
```

## Gate Evaluation

1. Retained observers/listeners after 1000 cycles: `0` -> `PASS`
2. Memory growth after 1000 cycles: `4.374 MB` (threshold `<= 10 MB`) -> `PASS`

## Notes

1. This manual run validates lifecycle leak behavior and memory growth in local Node runtime.
2. It does not replace ServiceNow staging integration/perf checks from `TEST_MATRIX_INTEGRATION.md`.
