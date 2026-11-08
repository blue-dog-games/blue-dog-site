#!/bin/sh
set -e
mkdir -p /app/data
if [ ! -f /app/data/blue-dog.db ]; then
  echo "seeding database from image"
  cp -a /seed/. /app/data/ 2>/dev/null || true
fi
exec node server.js
