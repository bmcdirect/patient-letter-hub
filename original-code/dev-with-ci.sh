#!/bin/bash
set -e  # Exit on any error

echo "🔄 Starting PatientLetterHub with CI checks..."

# Run CI checks first
./ci-check.sh

# If CI checks pass, start the development server
echo "🚀 CI checks passed! Starting development server..."
exec npm run dev