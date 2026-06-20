# Cross-TV SDK Lab

A production-style portfolio project demonstrating a custom framework-free, ES5-compatible Smart TV/HbbTV/CTV-style JavaScript SDK, a Node.js/TypeScript backend API, and a simulated TV Demo web app.

---

## Repository Structure

- [packages/tv-sdk](./packages/tv-sdk): The core TV SDK. Framewok-free, ES5-compatible prototype JavaScript. Includes EventBus, FocusManager, VideoAdapter, AdBreakManager, TelemetryClient, ErrorReporter, DeviceProfile, and NetworkRetry.
- [apps/api](./apps/api): TypeScript backend API built on Node.js and Express. Collects telemetry, aggregates error logs, registers sessions, and serves platform configuration files.
- [apps/tv-demo](./apps/tv-demo): Vanilla HTML/CSS/JS client-side web application portal simulating a Smart TV UI. Handles D-Pad navigation, remote key bindings, video players, ad interruptions, and diagnostic consoles.
- [infra](./infra): Infrastructure configurations (Nginx config).
- [docs](./docs): Detailed documentation files.

---

## Technical Documentation Links

For a deeper look into the codebase, engineering constraints, and setup details, please review:
- [System Architecture & Components Design](./docs/architecture.md)
- [Testing & Quality Assurance Strategy](./docs/testing-strategy.md)
- [Deployment, Docker & Proxy Configuration](./docs/deployment.md)
- [CTV/Smart TV Engineering Constraints Deep Dive](./docs/project-deep-dive.md)
- [AI-Assisted Development & Debugging Summary](./docs/ai-assisted-development.md)
- [Copy-Paste Job Application Submission Answer](./docs/application-answer.md)
- [Architectural Trade-offs & Review Notes](./docs/review-notes.md)

---

## Quick Start (Local Node.js)

To run the application locally:

```bash
# 1. Install all monorepo dependencies
npm install

# 2. Build modules (Compiles SDK UMD bundle and API TypeScript files)
npm run build

# 3. Execute all tests (Runs 8 API integration tests and 10 SDK unit tests)
npm test

# 4. Start concurrent development servers (API on 4000, Demo UI on 8080)
npm run dev
```

Navigate to `http://localhost:8080` to experience the TV client.

---

## Running with Docker Compose

To launch the entire container cluster (API, UI, and Nginx reverse proxy gateway):

```bash
docker compose up --build
```

Access the application unified gateway at `http://localhost` (port 80).

---

## Detailed Test Actions

Individual workspace test commands:
- **SDK Unit Tests**: `npm run test:sdk` (runs Mocha assertions via headless mocks)
- **API Tests**: `npm run test:api` (runs Supertest integration checks)
- **E2E Tests**: `npm run test:e2e` (runs Playwright browser D-Pad navigation tests)
