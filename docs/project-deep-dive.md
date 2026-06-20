# CTV & Smart TV Engineering Deep Dive

Connected TV (CTV) and Smart TV development represents a highly specialized branch of front-end engineering. Unlike standard web browsers running on modern PCs or smartphones, TV browsers operate under severe memory and hardware constraints.

---

## 1. The Legacy Browser Fragmentation Problem

TV platforms run customized browser runtimes that are rarely updated after a TV model is sold:
- **Samsung Tizen**: Older models run legacy versions of Chromium (e.g. Chrome 47 on Tizen 3.0, released in 2017).
- **LG webOS**: Legacy webOS versions run outdated Chrome engines (e.g. Chrome 38 on webOS 2.0).
- **HbbTV (Hybrid Broadcast Broadband TV)**: Common in Europe, early versions run on older WebKit engines with limited ES6 support.
- **Orsay / Legacy TV**: Proprietary Opera or NetFront browser engines with zero modern JS capabilities.

### Why ES5 and Prototypes?
To support legacy runtimes without risking syntax compilation errors (which crash the entire TV app on boot), the TV SDK is written in ES5-compatible, prototype-based JavaScript:
- **No ES6 Classes or Arrow Functions**: Modern compilation pipelines transpiling class definitions to ES5 generate large, bloated polyfill wrappers that degrade performance on low-end TV CPUs. Direct prototype manipulation is lightweight and native.
- **No framework overhead**: Frameworks like React or Angular add high memory overhead and virtual DOM calculations, causing sluggish frame rates on low-end TV chipsets. Framework-free vanilla JavaScript guarantees smooth 60fps rendering.

---

## 2. Remote Controls & Spatial Navigation (D-Pad)

Unlike PCs (mouse) or mobiles (touchscreen), TV user interactions are limited to D-Pad (Up, Down, Left, Right, OK/Enter, and Return/Back).

### Spatial Coordinate Math
Because there is no mouse pointer, the application must maintain an active focus state. When a user presses a direction button, the `FocusManager` must scan the DOM and calculate which element is spatially closest:
1. Extract screen positions of all `.focusable` elements using `getBoundingClientRect()`.
2. Filter out elements that are not in the coordinate vector of the requested direction.
3. Apply directional weighting. In TV design, horizontal elements are typically closer to each other than vertical lists. The formula:
   $$\text{Distance} = \Delta \text{PrimaryAxis} + 2.5 \times \Delta \text{OrthogonalAxis}$$
   heavily penalizes orthogonal movement, preventing the focus from jumping diagonally to another list.

---

## 3. Telemetry Pipeline Constraints

When a TV is streaming, network bandwidth is prioritized for video playback (HLS/DASH chunks). Constant telemetry pings (like Google Analytics tracking every hover) can starve the video player buffer, causing playback stalls.

- **Batching**: The `TelemetryClient` stores events in memory and flushes them in small batches (e.g. 3-5 events) to minimize active TCP connection overhead.
- **XHR over Fetch**: Standard `XMLHttpRequest` is universally supported, whereas `fetch` requires heavy polyfills on legacy TV runtimes.
- **Buffer Backpressure**: If the TV loses connection (common during local Wi-Fi drops), the SDK caches events in memory. A strict queue cap (100 events) prevents memory leaks from crashing the application during extended offline play.
