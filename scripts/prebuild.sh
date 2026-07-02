#!/bin/bash
# Pre-build script: switches Prisma provider based on DATABASE_URL
# If DATABASE_URL starts with "postgres", use postgresql provider
# Otherwise, use sqlite (local dev)

set -e

SCHEMA_FILE="prisma/schema.prisma"

if [[ "$DATABASE_URL" == postgres* ]]; then
  echo "📦 Detected PostgreSQL DATABASE_URL — switching schema provider to postgresql"
  sed -i 's/provider = "sqlite"/provider = "postgresql"/' "$SCHEMA_FILE"
else
  echo "📦 Using SQLite for local development"
  sed -i 's/provider = "postgresql"/provider = "sqlite"/' "$SCHEMA_FILE"
fi

# Always regenerate the Prisma client
npx prisma generate
