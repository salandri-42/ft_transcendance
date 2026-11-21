# Service Gateway - Trace & Documentation

## Service Role
This service acts as the **API Gateway**, the single entry point for all API requests (`/api/...`) coming from Nginx.
It centralizes validation, authentication (guards), and routing to backend microservices (Identity, Cosmos, etc.).

## Why NestJS?
The architecture was chosen to benefit from:
- A modular structure (Modules, Controllers, Services).
- Strong typing with TypeScript.
- Powerful decorators for routing and guards.

## Infrastructure & Configuration
- **Port**: ${NESTJS_PORT} (Internal Net, not directly exposed to the public).
- **Network**: `internal_net`.
- **Dependencies**: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`.

## Implementation Details

### 1. File `src/main.ts`
**Role**: Application entry point.
- **Function `bootstrap()`**:
  - Initializes the NestJS instance (`NestFactory.create`).
  - Configures the listening port using `process.env.PORT` or ${NESTJS_PORT} by default.
  - Logs service startup.

### 2. File `src/app.module.ts`
**Role**: Root module that orchestrates dependencies.
- **Class `AppModule`**:
  - Declares the main controller `AppController`.
  - Declares the main service `AppService`.
  - Acts as the dependency injection container.

### 3. File `src/app.controller.ts`
**Role**: Handles incoming HTTP requests.
- **Function `getHello()`**:
  - Route: `GET /`
  - Calls `appService.getHello()`.
  - Basic welcome test endpoint.
- **Function `getHealth()`**:
  - Route: `GET /health`
  - Used to verify container readiness.

### 4. File `src/app.service.ts`
**Role**: Contains business logic.
- **Function `getHello()`**:
  - Basic welcome logic.
  - Keeps logic separated from presentation.

### 5. File `Dockerfile`
**Role**: Defines the service Docker image using an optimized **Multi-Stage Build**.
- **Stage `base`**: `node:20-alpine` + `package.json`.
- **Stage `development`**:
  - `ENV NODE_ENV=development`.
  - `npm install` (includes devDependencies).
  - `CMD ["npm", "run", "start:dev"]`.
- **Stage `production`**:
  - `ENV NODE_ENV=production`.
  - `npm ci --only=production` (production dependencies only).
  - `COPY . .` + `npm run build` (static build in `/dist`).
  - Final image contains only `/dist` and `node_modules`.

### 6. File `package.json`
**Role**: Manages dependencies and scripts.
- Scripts: `build`, `start:dev`, `lint`.
- Dependencies: NestJS core + TypeScript.
