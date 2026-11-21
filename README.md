*This project has been created as part of the 42 curriculum by arakoton, franaivo, nandrian, salandri, sranaivo.*

# Orel (ft_transcendence)

## Description
**Orel** is a distributed full-stack project combining a 3D galaxy experience, multiplayer interactions, secure authentication, AI-assisted interactions, and NFT minting.

### Goal
Build a technically advanced platform where users can:
- authenticate securely (email or 42 OAuth + 2FA),
- navigate a 3D universe,
- interact and create artworks,
- manage social connections,
- and mint artworks as NFTs.

### Key Features
- **3D Frontend** (React + Three.js): galaxy exploration, star/globe interactions.
- **Authentication & Security**: JWT sessions, email verification, 2FA, 42 OAuth.
- **User Management**: profile editing, avatar upload, friend code sharing.
- **Realtime / Distributed Services**: microservice architecture with Redis-backed communication.
- **NFT Pipeline**: artwork metadata + blockchain mint flow.
- **Secure Public Access**: local stack exposed through Cloudflare Tunnel to https://orel.page.

## Instructions

### Prerequisites
- Linux/macOS environment (Docker-capable)
- Docker Engine + Docker Compose
- GNU Make
- Node.js LTS + npm (for local service-level commands and tests)
- A configured `.env` file (from [/.env.example](.env.example))

### 1) Setup environment
1. Copy [/.env.example](.env.example) to `.env`.
2. Fill required values (JWT, SMTP, OAuth42, Cloudflare token, optional blockchain values).
3. Full variable reference: [Docs/technics/ENVIRONMENT_VARIABLES.md](Docs/technics/ENVIRONMENT_VARIABLES.md)

### 2) Run the project
From repository root:

```bash
make
```

This command builds required images and starts the stack.

### 3) Access
- Public access URL: https://orel.page
- Access is tunneled by Cloudflared (no direct public exposure of local services).
- Tunnel details: [Docs/technics/TUNNEL_SETUP.md](Docs/technics/TUNNEL_SETUP.md)

### 4) Useful commands
```bash
make help
make up
make down
make logs
make restart
make refresh
make clean
make fclean
```

## Team Information

### Members, roles, and responsibilities
- **arakoton**
	- Role(s): Product Owner, Developer (Cosmos, DevOps)
	- Responsibilities: backlog priorities, feature validation, Cosmos service ownership, deployment/infrastructure support.

- **salandri**
	- Role(s): PM / Scrum Master, Developer (LLM management)
	- Responsibilities: team coordination, planning/follow-up, blocker management, LLM integration workflow.

- **nandrian**
	- Role(s): Technical Lead / Architect, Developer (Backend, Identity)
	- Responsibilities: architecture decisions, backend quality standards, critical reviews, identity/security implementation.

- **franaivo**
	- Role(s): Developer (Frontend) and ELK
	- Responsibilities: React/Three.js UI, UX flow implementation, integration with backend endpoints.

- **sranaivo**
	- Role(s): Developer (NFT)
	- Responsibilities: NFT functional scope, blockchain integration support, asset minting feature contribution.

Detailed role sheet: [Docs/project/ROLE_DISTRIBUTION.md](Docs/project/ROLE_DISTRIBUTION.md)  
Service ownership sheet: [Docs/project/SERVICE_DISTRIBUTION.md](Docs/project/SERVICE_DISTRIBUTION.md)

## Project Management
- **Work organization**
	- Functional ownership by service/module.
	- Shared review and integration process.
	- Iterative planning + periodic sync meetings.

- **Tracking tools**
	- Git branches + pull/merge workflow.
	- Repository issues/checklists and milestone-based delivery.

- **Communication channels**
	- Team chat/voice for daily coordination.
	- Async updates through repository discussions/commits.

## Technical Stack

### Frontend
- React
- Three.js
- Styled Components
- Vite
- TypeScript

### Backend
- NestJS microservices (`gateway`, `identity`, `cosmos`, `pythia`, `scribe`)
- TypeScript
- Socket.IO (realtime)
- Redis (pub/sub + queues)

### Database and persistence
- PostgreSQL (primary relational storage)
- Prisma ORM

### Other significant technologies
- Docker + Docker Compose
- Nginx (reverse proxy)
- Cloudflared / Cloudflare Tunnel
- Hardhat + Solidity + Ethers.js (NFT/smart contracts)
- ELK stack (observability)

### Justification for major technical choices
- **Microservices + NestJS**: clear boundaries for auth/game/AI/blockchain domains.
- **PostgreSQL + Prisma**: robust relational model with maintainable typed schema workflows.
- **React + Three.js**: strong fit for interactive 3D experience and modern UI.
- **Cloudflare Tunnel**: secure public access for a locally hosted stack.

Technical detail file: [Docs/technics/TECHS_USED.md](Docs/technics/TECHS_USED.md)

## Database Schema

### High-level structure
- **Identity database**
	- `User` (authentication/profile/2FA/email verification)
	- `Session` (refresh session lifecycle)
	- `Friendship` (social graph + status)
	- `FriendInvite` (code/token invitation flow)

- **Cosmos database**
	- `Star` (3D world nodes)
	- `Artwork` (user creations linked to stars, NFT mint fields)

### Main relationships
- `User (1) -> (N) Session`
- `User (1) -> (N) Friendship` (as requester/addressee)
- `User (1) -> (N) FriendInvite`
- `Star (1) -> (N) Artwork`

### Key fields (examples)
- `User`: `id: String`, `email: String`, `username: String`, `twoFaOn: Boolean`, `isEmailVerified: Boolean`
- `Session`: `refreshToken: String`, `expiresAt: DateTime`
- `Friendship`: `status: FriendshipStatus`, `requesterId`, `addresseeId`
- `Star`: coordinates `x/y/z: Float`, `ownerId: String?`
- `Artwork`: `imageData: Bytes`, `ownerId: String`, `isMinted: Boolean`, `tokenId: Int?`, `txHash: String?`

Schema sources:
- [services/identity/prisma/schema.prisma](services/identity/prisma/schema.prisma)
- [services/cosmos/prisma/schema.prisma](services/cosmos/prisma/schema.prisma)

## Features List
- **Account creation (email + 42 OAuth)** — arakoton, nandrian
- **Email verification + 2FA** — nandrian
- **3D navigation and interaction flow** — franaivo
- **Artwork creation flow** — franaivo, arakoton
- **User dashboard/profile management** — nandrian, franaivo
- **Friend invitation/code sharing** — nandrian
- **Realtime integration (Redis/WebSocket)** — arakoton, nandrian
- **LLM-assisted interactions** — salandri
- **NFT minting pipeline** — sranaivo, nandrian
- **Infrastructure / deployment / observability** — arakoton, nandrian

Usage docs:
- [Docs/usage/RUN.md](Docs/usage/RUN.md)
- [Docs/usage/PRINCIPLE_USE.md](Docs/usage/PRINCIPLE_USE.md)
- [Docs/usage/USER_MANAGEMENT.md](Docs/usage/USER_MANAGEMENT.md)

## Modules

### Breakdown by subject group (sub-totals)
- Web: **7 points**
- Accessibility and Internationalization: **4 points**
- User Management: **5 points**
- Artificial Intelligence: **4 points**
- Gaming and User Experience: **2 points**
- Devops: **4 points**
- Modules of choice: **3 points**

### Total
- Claimed modules score: **29 points**

### References
- Module validation and grouped scoring: [Docs/Modules/MODULES_VALIDATION.md](Docs/Modules/MODULES_VALIDATION.md)
- Module-to-service implementation evidence: [Docs/Modules/MODULES_SERVICE_EVIDENCE.md](Docs/Modules/MODULES_SERVICE_EVIDENCE.md)

## Individual Contributions
- **arakoton**
	- PO responsibilities and validation loop.
	- Cosmos service contribution.
	- DevOps and stack orchestration support.
	- Challenge: cross-service runtime consistency; solved via shared run procedures and infra checks.

- **franaivo**
	- Frontend development (3D UI interactions and user-facing flows).
	- Challenge: balancing visual complexity/performance; solved through iterative optimization and scoped interactions.

- **nandrian**
	- Backend/identity ownership and architecture decisions.
	- Security/auth implementation (JWT, email verification, 2FA).
	- Challenge: service integration and contract boundaries; solved with module-level interfaces and incremental integration.

- **salandri**
	- Scrum facilitation + planning cadence.
	- LLM management integration and operational coordination.
	- Challenge: aligning AI features with product scope; solved through iterative validation with team feedback.

- **sranaivo**
	- NFT module development and feature definition.
	- Challenge: on-chain/off-chain consistency; solved with explicit status tracking and integration workflow.

## Resources

### Classic references
- NestJS: https://docs.nestjs.com/
- React: https://react.dev/
- Three.js: https://threejs.org/docs/
- Prisma: https://www.prisma.io/docs
- PostgreSQL: https://www.postgresql.org/docs/
- Socket.IO: https://socket.io/docs/v4
- Docker: https://docs.docker.com/
- Hardhat: https://hardhat.org/docs
- Ethers.js: https://docs.ethers.org/
- Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/

### AI usage disclosure
AI tools were used for:
- documentation drafting and rewriting,
- proposing architecture alternatives,
- boilerplate suggestions for service/module structure,
- debugging hypotheses and test ideas,
- consistency checks across docs and naming.

AI was used in documentation and engineering support tasks only; all final decisions, implementations, and validations were performed by team members.

## Additional Documentation
- [AGENTS.md](AGENTS.md)
- [Docs/technics/TUNNEL_SETUP.md](Docs/technics/TUNNEL_SETUP.md)
- [Docs/technics/ENVIRONMENT_VARIABLES.md](Docs/technics/ENVIRONMENT_VARIABLES.md)
- [Docs/technics/TECHS_USED.md](Docs/technics/TECHS_USED.md)
- [Docs/project/ROLE_DISTRIBUTION.md](Docs/project/ROLE_DISTRIBUTION.md)
- [Docs/project/SERVICE_DISTRIBUTION.md](Docs/project/SERVICE_DISTRIBUTION.md)
