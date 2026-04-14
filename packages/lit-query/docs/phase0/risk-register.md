# Risk Register Template

| Risk                                        | Owner | Likelihood | Impact | Mitigation                                    | Trigger                     | Status |
| ------------------------------------------- | ----- | ---------- | ------ | --------------------------------------------- | --------------------------- | ------ |
| TS inference parity drift (`createQueries`) |       | Medium     | High   | Dedicated type tests + isolated Phase 3B gate | Type regressions in CI      | Open   |
| Lifecycle duplicate subscriptions           |       | Medium     | High   | Idempotency tests + reconnect matrix          | Observer count > expected   | Open   |
| ServiceNow CSP/module incompatibility       |       | Medium     | High   | Week-1 compatibility spike and kill criteria  | Blocked runtime import/eval | Open   |
| Memory leak on host churn                   |       | Medium     | High   | 1000-cycle mount/unmount test in CI           | Retained listeners > 0      | Open   |
| Rollout regression in pilot                 |       | Low        | High   | Staged rollout + rollback runbook             | Error-rate threshold breach | Open   |
