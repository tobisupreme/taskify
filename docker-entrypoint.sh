#!/bin/sh

# Apply database migrations
echo "Applying database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting the application..."
exec node dist/src/main
