# Service Frontend - Trace & Documentation

## Service Role

This service is the **React Client Application (SPA)**.
Its responsibilities include:

- 3D rendering (Three.js / React Three Fiber).
- User Interface (UI).
- Local state management (Zustand).
- WebSocket communication with Cosmos.

## Infrastructure & Configuration

- **Port**:
  - Dev (Vite): 5173 (internal).
  - Prod (Nginx): 80 (internal).
- **Network**: `internal_net`.
- **Dependencies**: `react`, `react-dom`, `@react-three/fiber`, `@react-three/drei`, `three`, `vite`.

## Implementation Details

### 1. File `src/main.tsx`

**Role**: React entry point.

- Initializes the ReactDOM root on `<div id="root">`.
- Imports `index.css`.

### 2. File `src/App.tsx`

**Role**: Root component.

- Contains the R3F `<Canvas>`.
- Displays a demo cube and stars (`<Stars />`).
- Configures camera controls (`<OrbitControls />`).

### 3. File `vite.config.ts`

**Role**: Vite bundler configuration.

- Dev server on `0.0.0.0` and port `5173`.
- `usePolling: true` (important for Docker on some OS setups).

### 4. File `Dockerfile`

**Role**: Multi-stage build (Dev/Prod).

- **Stage `development`**:
  - `npm run dev -- --host 0.0.0.0`.
  - Hot Module Replacement (HMR) active via volume binding.
- **Stage `production`**:
  - `npm run build`.
  - Serves static `/dist` files through a lightweight Alpine Nginx server.

### 5. File `package.json`

**Role**: Dependencies.

- `type: module` (ESM).
- Scripts `dev`, `build`, `lint`.
