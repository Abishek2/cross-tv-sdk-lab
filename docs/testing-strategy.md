# Testing Strategy

The Cross-TV SDK Lab employs a comprehensive, multi-tiered testing strategy spanning unit, integration, and E2E verification to assure production-ready reliability.

---

## Testing Matrix

| Tier | Directory | Framework | Scope / Coverage |
| :--- | :--- | :--- | :--- |
| **Unit Tests** | `packages/tv-sdk/test` | Mocha | EventBus, RemoteControl mappings, FocusManager spatial navigation, VideoAdapter event translations, AdBreakManager interruptions, TelemetryClient queues, DeviceProfile UA rules, NetworkRetry backoffs. |
| **Integration Tests** | `apps/api/test` | Mocha + Supertest | Express routing logic, in-memory store states, dynamic device configuration matching, telemetry payload validations. |
| **E2E Tests** | `apps/tv-demo/test` | Playwright | Remote navigation key sequences, focus changes, HbbTV overlay toggling, screen loading, telemetry integration. |

---

## 1. SDK Unit Testing (Node DOM Simulation)

Since the TV SDK runs framework-free and targets legacy web environments, the unit tests run under standard Node.js without the overhead of heavy virtual DOM trees. 

We mock the global DOM properties (`window`, `document`, `navigator`, `XMLHttpRequest`) at the top of `test/sdk.test.js`:
- Override `global.navigator` utilizing `Object.defineProperty` to bypass read-only constraints in newer Node versions.
- Implement element coordinate mock interfaces (`getBoundingClientRect`) to evaluate spatial focus distances.
- Mock asynchronous `XMLHttpRequest` status handlers to test batch telemetry flush retries.

Run SDK unit tests directly from the root:
```bash
npm run test:sdk
```

---

## 2. API Integration Testing (Supertest)

The Express backend routes are evaluated by spinning up a transient Express app listener, performing HTTP assertions, and shutting down clean. We use Node's native `assert` library to keep dependencies minimal and stable:
- Verifies proper JSON response types.
- Asserts that posting a telemetry batch correctly increments system counters.
- Asserts session registration schemas.

Run API tests directly from the root:
```bash
npm run test:api
```

---

## 3. End-to-End Testing (Playwright TV Simulation)

Playwright runs headless browsers to simulate actual user remote control bindings.
- Simulates keyboard presses like `ArrowDown`, `ArrowUp`, `Enter`, `Backspace`, and `Escape`.
- Observes DOM class list mutations (checking that elements transition from `.menu-item` to `.menu-item.focused`).
- Intercepts console logs and page errors via page event listeners to verify zero uncaught runtime exceptions during active page flows.

Run Playwright E2E tests:
```bash
npm run test:e2e
```
