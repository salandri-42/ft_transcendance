# Technologies Used in this Project

## Frontend
- **React**: UI framework for the client application.
- **Three.js**: 3D rendering for the galaxy/game visual experience.
- **Styled Components**: component-scoped CSS styling approach.
- **Vite**: frontend dev server and build tool.
- **TypeScript**: typed JavaScript for safer frontend code.

## Backend
- **NestJS**: backend framework used for all core services:
  - `gateway` (API gateway / routing),
  - `identity` (authentication and user management),
  - `cosmos` (core game service),
  - `pythia` (AI and matchmaking),
  - `scribe` (blockchain integration).
- **TypeScript**: primary backend language.

## Authentication & Security
- **JWT**: access/refresh token strategy.
- **Passport (Nest integrations)**: authentication strategies.
- **42 OAuth**: external login provider integration.
- **2FA**: second-factor authentication flow.
- **Rate limiting**: API protection against abuse.

## Real-time / Multiplayer
- **WebSocket (Socket.IO via NestJS gateways)**: low-latency real-time game communication.
- **Redis Pub/Sub**: event distribution and scaling support between services.

## Data Layer
- **PostgreSQL**: primary relational database.
- **Prisma**: ORM / data access layer and schema management.

## Blockchain (Scribe service)
- **Solidity**: smart-contract language.
- **Hardhat**: smart-contract development, compile, and test workflow.
- **Ethers.js**: blockchain client interactions.
- **IPFS tooling (Pinata / NFT.Storage)**: decentralized metadata storage (project-dependent flows).

## Infrastructure & Networking
- **Docker / Docker Compose**: containerization and multi-service orchestration.
- **Nginx**: reverse proxy and ingress routing.
- **Cloudflare Tunnel (`cloudflared`)**: secure tunnel from local runtime to Cloudflare edge.
- **Cloudflare + Name.com DNS**: public access through `https://orel.page`.

## Observability / Ops
- **ELK stack (Elasticsearch, Logstash, Kibana)**: centralized logs and monitoring support.

## Testing & Quality
- **Jest**: unit/integration testing for NestJS services.
- **ESLint**: linting and code-quality checks.
- **Prettier**: formatting standardization.

## Build and Run Entry Points
- **Makefile**: user-friendly project commands (`make`, `make up`, `make down`, `make logs`, etc.).
- **npm scripts**: service-level build, run, lint, and test workflows.

## Related Technical Documents
- [Tunnel setup](TUNNEL_SETUP.md)
- [Project root README](../../README.md)
- [Development guide](../../AGENTS.md)
