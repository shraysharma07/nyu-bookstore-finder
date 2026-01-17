#!/bin/bash
# Debug script to see what's in DATABASE_URL

echo "=== DATABASE_URL Debug ==="
echo ""

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set"
  echo ""
  echo "To set it:"
  echo "  export DATABASE_URL=\"\$(eb printenv | grep DATABASE_URL | cut -d'=' -f2- | tr -d '\\\"')\""
  exit 1
fi

echo "Full DATABASE_URL (first 100 chars):"
echo "${DATABASE_URL:0:100}..."
echo ""

# Remove query params
DB_URL="${DATABASE_URL%%\?*}"
DB_URL=$(echo "$DB_URL" | xargs)  # Trim

echo "Connection string (without query params):"
echo "$DB_URL"
echo ""

# Try to extract components
echo "Attempting to extract components..."
echo ""

DB_USER=$(echo "$DB_URL" | sed -n 's|.*postgres://\([^:]*\):.*|\1|p' | xargs)
DB_PASS=$(echo "$DB_URL" | sed -n 's|.*postgres://[^:]*:\([^@]*\)@.*|\1|p' | xargs)
DB_HOST=$(echo "$DB_URL" | sed -n 's|.*postgres://[^@]*@\([^:]*\):.*|\1|p' | xargs)
DB_PORT=$(echo "$DB_URL" | sed -n 's|.*postgres://[^@]*@[^:]*:\([^/]*\)/.*|\1|p' | xargs)
DB_NAME=$(echo "$DB_URL" | sed -n 's|.*postgres://[^/]*/\([^?]*\).*|\1|p' | xargs)

echo "Extracted values:"
echo "  User: '$DB_USER'"
echo "  Pass: '${DB_PASS:0:3}...' (first 3 chars only)"
echo "  Host: '$DB_HOST'"
echo "  Port: '$DB_PORT'"
echo "  Database: '$DB_NAME'"
echo ""

# Check if extraction worked
if [ -z "$DB_USER" ]; then
  echo "⚠️  WARNING: Could not extract DB_USER"
fi
if [ -z "$DB_PASS" ]; then
  echo "⚠️  WARNING: Could not extract DB_PASS"
fi
if [ -z "$DB_HOST" ] || [ "$DB_HOST" = "host" ]; then
  echo "⚠️  WARNING: Could not extract DB_HOST (got: '$DB_HOST')"
  echo "   This suggests the URL format might be different"
fi
if [ -z "$DB_PORT" ]; then
  echo "⚠️  WARNING: Could not extract DB_PORT"
fi
if [ -z "$DB_NAME" ]; then
  echo "⚠️  WARNING: Could not extract DB_NAME"
fi

echo ""
echo "If extraction failed, your DATABASE_URL format might be:"
echo "  - postgresql:// instead of postgres://"
echo "  - Missing port number"
echo "  - Different format"
echo ""
echo "You can manually set the variables:"
echo "  export DB_HOST='your-rds-endpoint.region.rds.amazonaws.com'"
echo "  export DB_PORT='5432'"
echo "  export DB_USER='your-username'"
echo "  export DB_PASS='your-password'"
echo "  export DB_NAME='your-database-name'"
