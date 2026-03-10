#!/bin/sh
set -e

mkdir -p /app/public/uploads

PRISMA="./node_modules/.bin/prisma"

if [ -d prisma/migrations ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "Applying Prisma migrations..."

  # Try migrate deploy first
  if $PRISMA migrate deploy 2>&1; then
    echo "Migrations applied successfully."
  else
    # P3005: DB has tables but no migration history (was created with db push)
    # Baseline the existing schema by marking 0_init as already applied
    echo "Baselining existing database..."
    $PRISMA migrate resolve --applied 0_init 2>&1 || true

    # Now apply remaining migrations
    echo "Applying pending migrations..."
    $PRISMA migrate deploy 2>&1
  fi
else
  echo "No migrations found, running prisma db push..."
  $PRISMA db push --accept-data-loss
fi

echo "Running seed..."
bun run seed

echo "Starting server..."
exec bun server.js
