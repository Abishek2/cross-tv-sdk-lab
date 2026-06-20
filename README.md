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

---

## Demo Video Playback & Fallback Handling

The TV Demo features realistic HTML5 video playback by fetching a safe public test video stream:
- **Video Source**: Big Buck Bunny (`https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4`)
- **Spatial Controls**: Pressing `Enter` on the player screen toggles play/pause, `Escape` or `Backspace` returns to the dashboard, and `R` triggers the HbbTV overlay.
- **Simulated Ad Interruption**: A custom mid-roll ad break is scheduled to run 6 seconds into playback, pausing the content and rendering an overlay for 5 seconds.
- **Robust Fallback**: If the external video stream fails to load due to network, browser codecs, or CORS issues, the app displays a fallback notification (`External demo stream unavailable. SDK fallback state active.`) while maintaining full navigation, UI stability, and diagnostics capability.
