#!/bin/sh

if [ ! -f "/app/node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node" ]; then
  echo "[Entrypoint] Copying node_modules from image cache..."
  cp -rn /node_modules_cache/* /app/node_modules/ 2>/dev/null || true
  cp -r /node_modules_cache/.prisma /app/node_modules/ 2>/dev/null || true
  echo "[Entrypoint] Done copying."
fi

exec "$@"
