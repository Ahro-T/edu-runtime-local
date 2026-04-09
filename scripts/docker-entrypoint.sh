#!/bin/sh
set -e

echo "[entrypoint] Running schema migration..."
node dist/adapters/db/ensure-schema.js

echo "[entrypoint] Starting application..."
exec node dist/main.js
