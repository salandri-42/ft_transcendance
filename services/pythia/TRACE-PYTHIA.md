# Service Pythia - Trace & Documentation

## Service Role
This service is responsible for **Artificial Intelligence and Matchmaking**.
Its responsibilities include:
- Matchmaking algorithms (Elo, opponent search).
- AI for solo mode (virtual opponent).
- Game data analysis (advanced stats).

## Infrastructure & Configuration
- **Port**: 3003 (Internal Net).
- **Network**: `internal_net`.
- **Dependencies**: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`.

## Implementation Details

### 1. File `src/main.ts`
**Role**: Entry point.
- **Function `bootstrap()`**:
  - Initializes the application on port 3003.
  - Logs startup.

### 2. File `src/app.module.ts`
**Role**: Root module.
- Orchestrates `AppController` and `AppService`.

### 3. File `src/app.controller.ts`
**Role**: HTTP controller.
- **Function `getHello()`**:
  - Route: `GET /`
  - Returns "Hello World from Pythia!".
- **Function `getHealth()`**:
  - Route: `GET /health`
  - Returns "Pythia OK".

### 4. File `src/app.service.ts`
**Role**: Business logic.
- Simple for now.

### 5. File `Dockerfile`
**Role**: Multi-stage build (Dev/Prod).
- Uses `ARG NODE_ENV` for maximum flexibility.

### 6. File `package.json`
**Role**: Standard NestJS dependencies.
