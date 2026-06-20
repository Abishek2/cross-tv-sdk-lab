# Architectural Review & Senior Engineering Notes

This document provides a critical review of the project architecture, evaluating trade-offs made during development and outline future production-ready enhancements.

---

## 1. Architectural Trade-offs & Decisions

### In-Memory Storage vs. Persistent Database
* **Decision**: Telemetry and error logs are stored in an in-memory Map structure (`apps/api/src/store.ts`).
* **Trade-off**: Fast setup, zero external dependencies, and extremely simple testing. However, all data is lost upon container restart.
* **Mitigation**: The store logic is encapsulated inside a unified Class interface. Swapping this out for SQLite (using `better-sqlite3` or `prisma`) or PostgreSQL requires modifying only the database adapter methods, leaving the Express controller routers unchanged.

### UMD Bundling vs. Native ESM (ES Modules)
* **Decision**: The TV SDK builds into a single ES5 UMD bundle (`packages/tv-sdk/dist/tv-sdk.umd.js`).
* **Trade-off**: By outputting ES5 and UMD, we support legacy TV engines (Tizen 3.0, webOS 2.0). The trade-off is that modern web bundlers cannot perform tree-shaking on UMD imports, which slightly increases bundle size in highly modern browser targets.
* **Justification**: For Smart TV contexts, legacy browser compatibility is the absolute priority over micro-optimizations in tree-shaking.

### XMLHttpRequest vs. Fetch API
* **Decision**: Utilized native `XMLHttpRequest` inside `TelemetryClient` and `ErrorReporter`.
* **Trade-off**: Verbose callback configuration lines compared to modern async/await `fetch`.
* **Justification**: Older TV browser runtimes do not support native `fetch` (requires bringing in heavy polyfills that increase runtime memory). Raw XHR is supported globally since the earliest Smart TV models.

---

## 2. Limitations & Future Work

If migrating this project into a production-grade enterprise SDK, the following features should be implemented:

1. **VAST & VMAP Integration**:
   Currently, the `AdBreakManager` schedules ad streams manually using static video endpoints. A production-ready player SDK should parse standard **VAST (Video Ad Serving Template)** and **VMAP (Video Multiple Ad Playlist)** XML structures from ad servers (like Google Ad Manager) to resolve dynamic wrappers, companions, and tracking beacons.
2. **Dynamic List Virtualization**:
   Large TV apps (like Netflix or YouTube catalog pages) contain thousands of list items. If all elements are loaded in the DOM, the `FocusManager` scan queries will become slow, causing input lag. Implementing a virtualized grid container that recycles DOM elements as the focus moves off-screen is necessary.
3. **Native DRM Wrapper**:
   To play premium copyright-protected content, the `VideoAdapter` must integrate EME (Encrypted Media Extensions) to coordinate Widevine, PlayReady, or FairPlay licenses.
4. **HbbTV Application Lifecycle Management**:
   For HbbTV broadcasts, the application needs to register with the TV's native `ApplicationManager` OIPF objects to handle broadcast-to-broadband transitions, key masking, and channel change events.
5. **Database Persistence**:
   Refactor the in-memory store in `apps/api` to use SQLite or PostgreSQL for persistent telemetry logging.
