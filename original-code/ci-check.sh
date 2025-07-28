#!/bin/bash
set -e  # Exit on any error

echo "🧪 Running PatientLetterHub CI checks..."

echo "1. Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000/api/auth/health")
if [ "$HEALTH_RESPONSE" != "200" ]; then
  echo "❌ Health check failed with status: $HEALTH_RESPONSE"
  exit 1
fi
echo "✅ Health endpoint passed"

echo "2. Testing practices endpoint..."
PRACTICES_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000/api/auth/practices")
if [ "$PRACTICES_RESPONSE" != "200" ]; then
  echo "❌ Practices endpoint failed with status: $PRACTICES_RESPONSE"
  exit 1
fi
echo "✅ Practices endpoint passed"

echo "3. Running Drizzle schema check..."
npx drizzle-kit check
echo "✅ Schema check passed"

echo "🎉 All CI checks completed successfully!"
