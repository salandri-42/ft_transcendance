#!/bin/sh
set -e

echo "⏳ Waiting for PostgreSQL to be ready..."
until nc -z postgres 5432; do
  sleep 1
done
echo "✅ PostgreSQL is ready!"

echo "🔄 Synchronizing database schema..."
npx prisma db push --accept-data-loss

echo "📦 Generating Prisma Client..."
npx prisma generate

echo "🚀 Starting application..."
exec "$@"
