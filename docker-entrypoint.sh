#!/bin/sh
set -e

mkdir -p /app/public/uploads

echo "Bootstrapping database..."
bun prisma/bootstrap.ts

echo "Starting server..."
exec bun server.js
