# Modules → Service Evidence Matrix

This file links each claimed module to the service(s) that implement it, with concrete technical artifacts used during evaluation.

## 1) Web

### Frameworks (Major + frontend minor + backend minor)
- **Services attached**: `frontend`, `gateway`, `identity`, `cosmos`, `pythia`, `scribe`
- **Evidence**:
  - Frontend framework (React): [services/frontend/src/main.tsx](../../services/frontend/src/main.tsx), [services/frontend/src/App.tsx](../../services/frontend/src/App.tsx)
  - Backend framework (NestJS): [services/gateway/src/main.ts](../../services/gateway/src/main.ts), [services/identity/src/main.ts](../../services/identity/src/main.ts)

### Real-time features (WebSocket) — Major
- **Services attached**: `cosmos`, `pythia`, `frontend`
- **Evidence**:
  - Gateway/WebSocket layer in Cosmos: [services/cosmos/src/galaxy/galaxy.gateway.ts](../../services/cosmos/src/galaxy/galaxy.gateway.ts)
  - Redis socket adapter: [services/cosmos/src/common/adapters/redis-io.adapter.ts](../../services/cosmos/src/common/adapters/redis-io.adapter.ts)
  - Frontend socket client: [services/frontend/src/services/galaxySocket.ts](../../services/frontend/src/services/galaxySocket.ts)

### ORM (Prisma) — Minor
- **Services attached**: `identity`, `cosmos`
- **Evidence**:
  - Identity schema: [services/identity/prisma/schema.prisma](../../services/identity/prisma/schema.prisma)
  - Cosmos schema: [services/cosmos/prisma/schema.prisma](../../services/cosmos/prisma/schema.prisma)
  - Prisma services: [services/identity/src/prisma/prisma.service.ts](../../services/identity/src/prisma/prisma.service.ts), [services/cosmos/src/prisma/prisma.service.ts](../../services/cosmos/src/prisma/prisma.service.ts)

## 2) Accessibility and Internationalization

### WCAG-related accessibility work — Minor
- **Services attached**: `frontend` and `pythia`
- **Evidence**:
  - UI components and usage docs for user flows: [Docs/usage/PRINCIPLE_USE.md](../usage/PRINCIPLE_USE.md), [Docs/usage/USER_MANAGEMENT.md](../usage/USER_MANAGEMENT.md)
  - Main UI entry: [services/frontend/src/components/users/LoginOverlay.tsx](../../services/frontend/src/components/users/LoginOverlay.tsx)
  - Voice/speech accessibility support (alternative interaction path): [services/frontend/src/services/audioCapture.ts](../../services/frontend/src/services/audioCapture.ts), [services/frontend/src/services/audioPlayback.ts](../../services/frontend/src/services/audioPlayback.ts)
  - AI voice processing path used by accessibility flow: [services/pythia/src/oracle/oracle-live.service.ts](../../services/pythia/src/oracle/oracle-live.service.ts)

### i18n — Minor
- **Services attached**: `frontend`
- **Evidence**:
  - i18n context: [services/frontend/src/contexts/i18nContext.tsx](../../services/frontend/src/contexts/i18nContext.tsx)
  - Translation hook: [services/frontend/src/hooks/useTranslation.ts](../../services/frontend/src/hooks/useTranslation.ts)
  - Language selector: [services/frontend/src/components/ui/LanguageSelector.tsx](../../services/frontend/src/components/ui/LanguageSelector.tsx)

### RTL support (Hebrew) — Minor
- **Services attached**: `frontend`
- **Evidence**:
  - i18n/selector integration: [services/frontend/src/contexts/i18nContext.tsx](../../services/frontend/src/contexts/i18nContext.tsx), [services/frontend/src/components/ui/LanguageSelector.tsx](../../services/frontend/src/components/ui/LanguageSelector.tsx)

### Multiple browser support — Minor
- **Services attached**: `frontend`
- **Evidence**:
  - Cross-browser web app runtime with Vite output and React app structure: [services/frontend/vite.config.ts](../../services/frontend/vite.config.ts), [services/frontend/src/App.tsx](../../services/frontend/src/App.tsx)

## 3) User Management

### Standard user management/auth — Major
- **Services attached**: `identity`, `frontend`
- **Evidence**:
  - Auth module: [services/identity/src/auth/auth.module.ts](../../services/identity/src/auth/auth.module.ts)
  - Auth controller/service: [services/identity/src/auth/auth.controller.ts](../../services/identity/src/auth/auth.controller.ts), [services/identity/src/auth/auth.service.ts](../../services/identity/src/auth/auth.service.ts)
  - Users module/controller: [services/identity/src/users/users.module.ts](../../services/identity/src/users/users.module.ts), [services/identity/src/users/users.controller.ts](../../services/identity/src/users/users.controller.ts)
  - Friends module/controller: [services/identity/src/friends/friends.module.ts](../../services/identity/src/friends/friends.module.ts), [services/identity/src/friends/friends.controller.ts](../../services/identity/src/friends/friends.controller.ts)

### OAuth 2.0 (42) — Minor
- **Services attached**: `identity`
- **Evidence**:
  - 42 strategy/guard: [services/identity/src/forty-two/ft.strategy.ts](../../services/identity/src/forty-two/ft.strategy.ts), [services/identity/src/forty-two/ft.guard.ts](../../services/identity/src/forty-two/ft.guard.ts)

### 2FA — Minor
- **Services attached**: `identity`
- **Evidence**:
  - Auth endpoints and logic: [services/identity/src/auth/auth.controller.ts](../../services/identity/src/auth/auth.controller.ts), [services/identity/src/auth/auth.service.ts](../../services/identity/src/auth/auth.service.ts)
  - 2FA fields in DB: [services/identity/prisma/schema.prisma](../../services/identity/prisma/schema.prisma)

### User activity dashboard / analytics — Minor
- **Services attached**: `frontend`, `identity`
- **Evidence**:
  - Dashboard UI: [services/frontend/src/components/ui/UserDashboard.tsx](../../services/frontend/src/components/ui/UserDashboard.tsx)

## 4) Artificial Intelligence

### Complete LLM interface — Major
- **Services attached**: `pythia`, `frontend`
- **Evidence**:
  - Gemini service: [services/pythia/src/gemini.service.ts](../../services/pythia/src/gemini.service.ts)
  - Oracle live/events modules: [services/pythia/src/oracle/oracle-live.service.ts](../../services/pythia/src/oracle/oracle-live.service.ts), [services/pythia/src/oracle/oracle-events.controller.ts](../../services/pythia/src/oracle/oracle-events.controller.ts)

### Voice / speech integration — Minor
- **Services attached**: `frontend`, `pythia`
- **Evidence**:
  - Audio capture/playback: [services/frontend/src/services/audioCapture.ts](../../services/frontend/src/services/audioCapture.ts), [services/frontend/src/services/audioPlayback.ts](../../services/frontend/src/services/audioPlayback.ts)

### Sentiment analysis — Minor
- **Services attached**: `pythia`
- **Evidence**:
  - AI/oracle pipeline components: [services/pythia/src/oracle/oracle-live.service.ts](../../services/pythia/src/oracle/oracle-live.service.ts), [services/pythia/src/history/history.service.ts](../../services/pythia/src/history/history.service.ts)

## 5) Gaming and User Experience

### Advanced 3D graphics — Major
- **Services attached**: `frontend`, `cosmos`
- **Evidence**:
  - 3D orbital system: [services/frontend/src/components/3d/orbital/OrbitalSystem.tsx](../../services/frontend/src/components/3d/orbital/OrbitalSystem.tsx)
  - Star rendering/interactions: [services/frontend/src/components/3d/stars/Star.tsx](../../services/frontend/src/components/3d/stars/Star.tsx)
  - 3D scene logic entry: [services/frontend/src/App.tsx](../../services/frontend/src/App.tsx)

## 6) Devops

### ELK log management — Major
- **Services attached**: `infra/elk`, all services (syslog output)
- **Evidence**:
  - Logstash pipeline: [infra/elk/logstash.conf](../../infra/elk/logstash.conf)
  - Kibana config: [infra/elk/kibana.yml](../../infra/elk/kibana.yml)
  - ELK bootstrapping: [infra/elk/entrypoint.sh](../../infra/elk/entrypoint.sh)
  - Compose services: [docker-compose.yml](../../docker-compose.yml)

### Backend as microservices — Major
- **Services attached**: `gateway`, `identity`, `cosmos`, `pythia`, `scribe`
- **Evidence**:
  - Runtime orchestration: [docker-compose.yml](../../docker-compose.yml)
  - Service boundaries in source folders: [services/](../../services/)

## 7) Modules of choice

### NFT module — Major
- **Services attached**: `scribe`, `cosmos`, `frontend`
- **Evidence**:
  - Module justification: [Docs/Modules/NFT_MODULE.md](NFT_MODULE.md)
  - Blockchain module/controller/service: [services/scribe/src/blockchain/blockchain.module.ts](../../services/scribe/src/blockchain/blockchain.module.ts), [services/scribe/src/blockchain/blockchain.controller.ts](../../services/scribe/src/blockchain/blockchain.controller.ts), [services/scribe/src/blockchain/blockchain.service.ts](../../services/scribe/src/blockchain/blockchain.service.ts)
  - NFT DTO/interface: [services/scribe/src/blockchain/dto/create-nft.dto.ts](../../services/scribe/src/blockchain/dto/create-nft.dto.ts), [services/scribe/src/blockchain/interfaces/nft-metadata.interface.ts](../../services/scribe/src/blockchain/interfaces/nft-metadata.interface.ts)

### Cloudflared module — Minor
- **Services attached**: `cloudflared`, `nginx` (entry), full stack behind proxy
- **Evidence**:
  - Module justification: [Docs/Modules/CLOUDFLARED_MINOR_MODULE.md](CLOUDFLARED_MINOR_MODULE.md)
  - Tunnel setup note: [Docs/technics/TUNNEL_SETUP.md](../technics/TUNNEL_SETUP.md)
  - Compose profile/service: [docker-compose.yml](../../docker-compose.yml)

## Validation Usage During Evaluation
For each claimed module, evaluators can ask for:
1. A live functional demo.
2. Service-level proof (endpoint/UI flow).
3. Source-level proof (files linked above).

This file is intended to provide quick traceability from rubric module → implementation service(s) → concrete artifacts.
