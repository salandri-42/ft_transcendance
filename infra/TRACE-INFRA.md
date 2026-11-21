# Infrastructure - Trace & Documentation

## Infrastructure Role

This folder contains the global DevOps configuration for the project. It defines how services are built, orchestrated, and connected.

## Docker Strategy

The project uses a "Docker Compose for runtime, Docker Bake for build" approach.
This allows parallel image builds while keeping orchestration simple.

## File Details

### 1. File `docker-compose.yml` (root)

**Role**: Main orchestrator for the development environment.
**Defined services**:

- **nginx**: Reverse proxy. HTTP/HTTPS entry point.
- **frontend**: React development server (Vite).
- **gateway**: NestJS API Gateway.
- **identity, cosmos, pythia, scribe**: Backend microservices.
  **Special volume configuration**:
- Uses bind mounts (`./services/x:/app`) to synchronize source code.
- Uses anonymous volumes (`/app/node_modules`) to isolate Linux container dependencies.

### 2. File `docker-bake.hcl` (root)

**Role**: Centralized Docker build definition.
**Groups**:

- **dev**: Builds images in development mode (HMR, debugging).
- **prod**: Builds production-optimized images (minified, without dev dependencies).
  **Commands**:
- `docker buildx bake dev` (alias `make build` or `make build-dev`).
- `docker buildx bake prod` (alias `make build-prod`).

### 3. File `Makefile` (root)

**Role**: Command shortcuts to simplify the developer workflow.
**Commands**:

- `make build`: Build in DEV mode.
- `make build-prod`: Build in PROD mode.
- `make up`: Start Docker Compose in detached mode.
- `make clean`: Clean containers and volumes (prune).

### 4. Folder `infra/nginx/`

**Role**: Reverse proxy configuration.

- Contains Nginx runtime configuration (`nginx.conf`) and TLS certificates used by the stack.

### 5. ELK root files and `infra/postgres/` folder

**Role**: Centralized logging and database configuration.

- `kibana.yml`: Kibana configuration.
- `logstash.conf`: Logstash pipeline for Docker syslog ingestion.
- `docker-compose.yml`: Defines `elasticsearch`, `logstash`, `kibana`, and syslog logging for application services.
