# Deployment & Infrastructure Guide

This document outlines the deployment configurations, Docker setups, and reverse proxy details for running the Cross-TV SDK Lab.

---

## 1. Local Development Execution

To execute the project locally without containerization:

```bash
# 1. Install workspace dependencies
npm install

# 2. Build SDK UMD bundle and compile API TypeScript
npm run build

# 3. Start development servers (runs API on 4000 and TV Demo on 8080 concurrently)
npm run dev
```

The TV Demo will be accessible at `http://localhost:8080` and the telemetry API at `http://localhost:4000`.

---

## 2. Containerized Production (Docker Compose)

For production-style replication, the monorepo is fully containerized. We use a multi-stage Docker strategy to build the code inside isolated containers, ensuring zero host dependencies (like Node or TypeScript compilers) are needed.

To launch the container cluster:

```bash
docker compose up --build
```

### Services Mapped

| Container | Host Port | Purpose |
| :--- | :--- | :--- |
| **api** | `4000:4000` | Telemetry backend server running node/Express compiled output. |
| **tv-demo** | `8888:8080` | Static server representing the TV app portal. |
| **proxy** | `80:80` | Nginx reverse proxy serving as the single entrypoint gateway. |

Once launched, navigate to `http://localhost` (port 80) to access the integrated application.

---

## 3. Reverse Proxy Layout (Nginx)

The Nginx gateway (`infra/nginx.conf`) handles two key roles:
1. **Static Delivery**: Serves the index page and app scripts directly, proxying to the `tv-demo` container.
2. **Path Routing**: Routes all backend API routes (e.g. `/health`, `/telemetry/*`, `/config/*`, `/sessions`, `/errors`) automatically to the backend Node `api` container.

This avoids CORS preflight configuration complexities on older TV browsers and maps the client-side request logic to local path names (e.g. `/telemetry/batch` instead of a full domain path).
