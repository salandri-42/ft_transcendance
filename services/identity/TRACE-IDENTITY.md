# Service Identity - Trace & Documentation

## Service Role
This service is responsible for **Identity and User Management**.
Its responsibilities include:
- User registration (Register).
- Authentication (Login, 2FA).
- Profile management (Avatar, Stats).
- Providing user information to other services.

## Infrastructure & Configuration
- **Port**: 3001 (Internal Net).
- **Network**: `internal_net`.
- **Dependencies**: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`.

## Implementation Details

### 1. File `src/main.ts`
**Role**: Entry point.
- **Function `bootstrap()`**:
  - Initializes the application on port 3001 (or `process.env.PORT`).
  - Logs startup.

### 2. File `src/app.module.ts`
**Role**: Root module.
- Orchestrates `AppController` and `AppService`.

### 3. File `src/app.controller.ts`
**Role**: HTTP controller.
- **Function `getHello()`**:
  - Route: `GET /`
  - Returns a welcome message.
- **Function `getHealth()`**:
  - Route: `GET /health`
  - Returns "Identity OK". Critical for Docker health checks.

### 4. File `src/app.service.ts`
**Role**: Business logic.
- Contains the simple "Hello World" logic.

### 5. File `Dockerfile`
**Role**: Multi-stage build.
- **Stage `development`** :
  - Hot Reload via volumes.
  - `CMD ["npm", "run", "start:dev"]`.
- **Stage `production`** :
  - Optimized `/dist` build.
  - Production dependencies only.

### 6. File `package.json`
**Role**: Dependencies.
- Similar to other NestJS services.
