# Bundle Measurement

Date: 2026-03-06 (IST)  
Command: `npm run measure:bundle`

## Result

```json
{
  "measuredAt": "2026-03-05T17:36:05.350Z",
  "entryJsBytes": 963,
  "entryJsGzipBytes": 305,
  "distTotalBytes": 94594
}
```

## Gate Evaluation

1. Entrypoint gzip size: `305 B` (threshold `<= 1 KB`) -> `PASS`

## Latest Re-run (2026-03-06)

Note: Header date reflects local IST; `measuredAt` timestamps are UTC.

```json
{
  "measuredAt": "2026-03-05T18:59:50.617Z",
  "entryJsBytes": 963,
  "entryJsGzipBytes": 305,
  "distTotalBytes": 95758
}
```

Gate evaluation:

1. Entrypoint gzip size: `305 B` (threshold `<= 1 KB`) -> `PASS`
