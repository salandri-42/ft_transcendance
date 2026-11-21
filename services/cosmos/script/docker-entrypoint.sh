#!/bin/sh
set -e

echo "[cosmos] Waiting for PostgreSQL to be ready..."
until nc -z postgres 5432; do
	sleep 1
done
echo "[cosmos] PostgreSQL is ready"

echo "[cosmos] Synchronizing schema to cosmos_db..."
npx prisma db push --accept-data-loss

echo "[cosmos] Generating Prisma Client..."
npx prisma generate

echo "[cosmos] Starting application..."
exec "$@"
