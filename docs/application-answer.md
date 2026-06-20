# Software Engineer - TV Portfolio Submission

## Project Overview: Cross-TV SDK Lab

This project is a production-style repository demonstrating a framework-free, ES5-compatible Smart TV JavaScript SDK, a TypeScript/Node.js telemetry collection API, and a simulated 1080p D-Pad navigable Connected TV (CTV) application portal.

---

## How it Addresses Real-World CTV Constraints

1. **Framework-Free & Legacy Runtime Friendly**:
   Legacy Smart TVs (older Samsung Tizen, LG webOS, HbbTV) utilize outdated browser engines with slow CPUs and highly constrained memory. By avoiding frameworks (React, Angular) and compiler polyfill bloat, the SDK core is written in **ES5 prototype-style JavaScript**, keeping the bundle size minimal and CPU execution fast (60fps UI).
2. **Robust Spatial D-Pad Navigation**:
   Since TV screens lack mouse/touch pointers, our custom `FocusManager` implements a **weighted directional D-Pad navigation algorithm**. It parses elements containing focusable selectors, computes bounding rects, and filters candidates based on D-Pad vectors. It applies a distance penalty (weight factor 2.5) to orthogonal deviation, preventing diagonal jumping.
3. **Resilient Telemetry Transmission**:
   To prioritize network bandwidth for video streams, the `TelemetryClient` implements an **in-memory event queue** that batches payloads (e.g. size 3, 5s interval) and utilizes legacy-compatible `XMLHttpRequest` (avoiding `fetch` polyfills). If the backend is offline, events are cached and retried with **exponential backoff & randomized jitter**, with a 100-event ring-buffer cap to prevent memory overflows.
4. **Unified Media Wrapper & Ad Interruptions**:
   The `VideoAdapter` provides a standard media wrapper mapping HTML5 video events (play, pause, ended) to our centralized EventBus. The `AdBreakManager` intercepts the content stream timeline, pauses playback, runs pre-roll and mid-roll advertisement streams, and resumes main playheads upon ad termination.

---

## Technical Stack & Orchestration

- **Core SDK**: Vanilla JavaScript (ES5, UMD Bundle, Rollup).
- **Backend API**: Node.js + TypeScript + Express (CORS-enabled, structured for easy SQLite/Postgres integration).
- **Client App**: Vanilla HTML5, CSS3 Grid/Flexbox, and UMD SDK integration.
- **Testing**: Mocha (Unit & Integration), Playwright (Headless browser D-Pad simulation E2E tests).
- **Infrastructure**: Docker Multi-Stage builds, Nginx Proxy Gateway, Docker Compose, GitHub Actions CI.
