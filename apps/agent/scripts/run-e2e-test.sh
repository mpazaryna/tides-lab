#!/bin/bash

# Real End-to-End Test Runner for Multi-Bucket Storage
# This script runs tests against actual Cloudflare R2 buckets

echo "🚀 Tides Agent - Real E2E Test Runner"
echo "====================================="

# Check if E2E_TEST flag is set
if [ -z "$E2E_TEST" ]; then
    echo "❌ E2E_TEST environment variable not set"
    echo ""
    echo "To run real E2E tests:"
    echo "  export E2E_TEST=true"
    echo "  ./scripts/run-e2e-test.sh"
    echo ""
    echo "⚠️  WARNING: These tests will access real Cloudflare R2 buckets"
    echo "   Make sure you have proper credentials configured."
    exit 1
fi

echo "✅ E2E_TEST=true detected"
echo "📡 Running tests against REAL Cloudflare R2 buckets..."
echo ""

# Set test timeout higher for network requests
export JEST_TIMEOUT=30000

# Run the real E2E test
echo "🧪 Executing real file access tests..."
npx jest test/e2e/real-file-access.test.ts --verbose --detectOpenHandles --forceExit

echo ""
if [ $? -eq 0 ]; then
    echo "✅ All E2E tests passed!"
    echo "🎉 Multi-bucket storage successfully validated against real data"
else
    echo "❌ E2E tests failed"
    echo "💡 Check your Cloudflare R2 bucket connectivity and permissions"
fi