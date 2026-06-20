# Architecture & System Design

The **Cross-TV SDK Lab** is built as an npm workspace monorepo divided into three principal layers:
1. **ES5-Compatible SDK Core** (`packages/tv-sdk`): Framework-free prototype code running inside the simulated TV runtime.
2. **TypeScript express API** (`apps/api`): Telemetry event aggregator, error log collector, and dynamic profile configuration server.
3. **VanillaJS TV Demo Web Application** (`apps/tv-demo`): Simulated CTV launcher UI supporting full spatial/remote-control keyboard interaction.

---

## System Diagram

```mermaid
graph TD
    subgraph Browser / Smart TV Environment (Port 8080)
        UI[TV Demo HTML5/CSS3 Portal]
        SDK[TV SDK Factory - createTVSDK]
        FM[Spatial FocusManager]
        RC[RemoteControl Event Mapper]
        VA[Unified HTML5 VideoAdapter]
        AM[AdBreakManager Scheduler]
        TC[Batching TelemetryClient]
        ER[Global ErrorReporter]
    end

    subgraph Infrastructure Proxy (Port 80)
        NGINX[Nginx Reverse Proxy]
    end

    subgraph Node.js Backend Server (Port 4000)
        API[Express API Router]
        Store[In-Memory Store]
    end

    %% Client Interactions
    UI -->|Spatial Nav Focus| FM
    UI -->|Keypress Bindings| RC
    RC -->|Events| SDK
    VA -->|Playback State| SDK
    AM -->|Time Check Interrupts| VA
    
    %% Network Flow
    TC -->|XHR Batch POST /telemetry/batch| NGINX
    ER -->|XHR POST /errors| NGINX
    UI -->|GET /config/:profile| NGINX
    
    %% Proxy Flow
    NGINX -->|Forward Port 8080| UI
    NGINX -->|Forward Port 4000| API
    
    %% API internals
    API -->|Session Registry| Store
```

---

## Component Deep Dive

### 1. Unified EventBus
An ES5-compatible event broadcaster. Every SDK module communicates asynchronously via standard pub-sub lines. 
- *Aesthetic decoupling*: Instead of exposing direct references or hard-binding APIs, the player controls, telemetry pipeline, and diagnostic panel consume and emit events from a central bus.

### 2. Spatial FocusManager
A weighted distance-based directional search.
- Scans DOM elements matching selectors `[focusable], .focusable, [data-focusable="true"]`.
- Identifies active element and bounding coordinate rects.
- Calculates Manhattan distances on key press with high penalty coefficients for orthogonal deviation (weighting factor `2.5` for deviation):
  $$\text{Distance} = \Delta \text{PrimaryAxis} + 2.5 \times \Delta \text{OrthogonalAxis}$$
- This algorithm selects elements naturally aligned to the navigation vector, preventing diagonal skipping errors common on cheap TV hardware.

### 3. RemoteControl Handler
Translates standard TV platform remote control inputs (Samsung Tizen, LG webOS, HbbTV red-button/color inputs) alongside standard PC keyboard fallbacks (Arrow keys, Enter, Backspace, Escape, and R key for color overlay toggle) into standard SDK navigation actions.

### 4. TelemetryClient
Batches client events and schedules flushing under configurable metrics (e.g. batch size of 3, interval of 5s). Includes:
- Auto-caching: Failed requests prepend events back to the buffer.
- Ring-buffer memory protection: Queue capped at 100 events to prevent memory overflow on prolonged offline TV play.
- Compatibility: Uses raw `XMLHttpRequest` rather than modern `fetch` to accommodate older WebKit browsers on legacy Smart TVs.

### 5. AdBreakManager
Intercepts primary video timelines at designated seconds (e.g. 0s pre-roll, 30s mid-roll), pauses main stream, loads ad streams, tracks countdown progress, and restores original playheads upon ad termination.
