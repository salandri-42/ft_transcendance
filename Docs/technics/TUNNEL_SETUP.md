# Cloudflare Tunnel (cloudflared) — Technical Notes

## Overview
This project runs locally on a computer.

`cloudflared` creates a secure tunnel from the local runtime to Cloudflare, and Cloudflare maps that tunnel to:
- https://orel.page

The domain `orel.page` is administered through Name.com.

## End-to-End Flow
1. Services run locally (Docker/NestJS/Frontend stack).
2. `cloudflared` opens an outbound tunnel to Cloudflare.
3. Cloudflare routes HTTPS traffic for `orel.page` to that tunnel.
4. Requests are forwarded to the local project services.

## Why this setup
This architecture is used to provide:
- **Secure connection**: traffic is exposed through Cloudflare with HTTPS and tunnel-based ingress, without directly opening local inbound ports to the public internet.
- **Multi-device handling**: multiple devices can access the same running local project through a single public URL (`https://orel.page`).

## Practical implications
- The application is hosted locally, not on a public cloud VM.
- Public access path is controlled by Cloudflare + DNS domain mapping.
- Tunnel lifecycle depends on the local machine and `cloudflared` availability.

## Related project files
- [docker-compose.yml](../../docker-compose.yml)
- [infra/nginx/conf/nginx.conf](../../infra/nginx/conf/nginx.conf)
- [services/identity/CLOUDFLARE_TUNNEL_SETUP.md](../../services/identity/CLOUDFLARE_TUNNEL_SETUP.md)
