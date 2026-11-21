# Usage Guide

## Quick Start
1. From the project root, run:
   - `make`
2. Open the project through:
   - https://orel.page

## Common Commands
- `make help` — list available targets
- `make up` — start services in background
- `make down` — stop services
- `make logs` — follow logs
- `make restart` — restart running services
- `make refresh` — restart stack (`down` + `up`)

## Notes
- The app runs locally and is exposed through Cloudflare Tunnel.
- Public access is only available via https://orel.page.
