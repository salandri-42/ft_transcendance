# Cloudflared Tunnel Module — Minor Module Justification

## Module Summary
The **Cloudflared tunnel module** exposes the locally running project through a secure Cloudflare Tunnel and maps traffic to:
- https://orel.page

This module enables controlled remote access to the local stack without directly exposing local inbound ports.

## Why this module was chosen
- The project runs locally but must be reachable from multiple devices and evaluators.
- A tunnel-based approach is safer and cleaner than opening router/firewall ports.
- It fits the project context (demo-ready distributed app with remote access constraints).

## Technical challenges addressed
1. **Secure public exposure of local services**
   - Handles access to a local environment through Cloudflare edge.
   - Reduces direct attack surface on local host networking.

2. **Domain routing integration**
   - Binds tunnel traffic to `orel.page` (DNS/domain managed via Name.com + Cloudflare config).
   - Ensures a single stable public entry URL.

3. **Containerized operational integration**
   - Integrated as a dedicated service in Compose profile (`cloudflare`).
   - Requires token-based configuration and service dependency coordination.

4. **Reliability for multi-device usage**
   - Keeps access consistent across devices during local runtime.
   - Supports team/evaluator access using the same URL.

## Added value to the project
- **Practical value:** instant remote access to a local deployment.
- **Security value:** avoids direct public exposure of local ports.
- **Operational value:** repeatable setup through environment variables and Compose.
- **User/evaluator value:** one canonical URL for testing and demonstration.

## Why this deserves Minor module status (1 point)
This module is smaller in scope than a major feature, but still demonstrates technical skill and creativity:
- secure tunnel architecture understanding,
- DNS/domain + reverse access integration,
- environment-driven deployment with profile-based orchestration.

It is meaningful, non-trivial, and directly improves project usability and security.

## Acceptance criteria
- The project is accessible through `https://orel.page` when tunnel profile is enabled.
- Tunnel token is managed via `.env` (`CLOUDFLARE_TUNNEL_TOKEN`) and not hardcoded.
- Local services remain non-publicly exposed by default.
- Access path is documented for team and evaluators.
