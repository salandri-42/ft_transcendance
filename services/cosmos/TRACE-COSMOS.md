# Service Cosmos - Trace & Documentation

## Service Role
This service is **the core of gameplay and 3D simulation**.
Its responsibilities include:
- Managing the galaxy database (solar systems, planets, stars).
- Managing real-time WebSockets (player positions, chat).
- Implementing game and simulation logic.

## Infrastructure & Configuration
- **Port**: 3002 (Internal Net).
- **Network**: `internal_net`.
- **Dependencies**: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`.

## Implementation Details

### 1. File `src/main.ts`
**Role**: Entry point.
- **Function `bootstrap()`**:
  - Initializes the application on port 3002.
  - Logs startup.

### 2. File `src/app.module.ts`
**Role**: Root module.
- Orchestrates `AppController` and `AppService`.

### 3. File `src/app.controller.ts`
**Role**: HTTP controller.
- **Function `getHello()`**:
  - Route: `GET /`
  - Returns "Hello World from Cosmos!".
- **Function `getHealth()`**:
  - Route: `GET /health`
  - Returns "Cosmos OK". Critical for Docker health checks.

### 4. File `src/app.service.ts`
**Role**: Business logic.
- Simple for now.

### 5. File `Dockerfile`
**Role**: Multi-stage build (Dev/Prod).
- Uses `ARG NODE_ENV` for maximum flexibility.

### 6. File `package.json`
**Role**: Standard NestJS dependencies.
