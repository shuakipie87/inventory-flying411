#!/bin/bash
# API Endpoint Testing Script
# Tests all major API endpoints after deployment

set -e

echo "🧪 Flying411 API Testing Script"
echo "======================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL=${API_URL:-"http://mwk0c8okgooggssksgo8wg4w.76.13.181.153.sslip.io"}
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local expected_status=$4
    local data=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${BLUE}Testing: $name${NC}"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" 2>/dev/null || echo "000")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null || echo "000")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $method $endpoint (Status: $status_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        if [ ! -z "$body" ] && [ "$body" != "000" ]; then
            echo "   Response: $(echo $body | head -c 100)..."
        fi
    else
        echo -e "${RED}❌ FAIL${NC} - $method $endpoint"
        echo "   Expected: $expected_status, Got: $status_code"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        if [ ! -z "$body" ] && [ "$body" != "000" ]; then
            echo "   Response: $body"
        fi
    fi
    echo ""
}

echo "API Base URL: $API_URL"
echo ""
echo "Starting tests..."
echo "======================================="
echo ""

# Test 1: Health Check
test_endpoint "Health Check" "GET" "/health" "200"

# Test 2: CSRF Token
test_endpoint "CSRF Token" "GET" "/api/csrf-token" "200"

# Test 3: Listings (Public)
test_endpoint "Get Public Listings" "GET" "/api/listings" "200"

# Test 4: Parts (Public)
test_endpoint "Get Public Parts" "GET" "/api/parts" "200"

# Test 5: Auth - Login (Should fail without credentials)
test_endpoint "Login Endpoint" "POST" "/api/auth/login" "400"

# Test 6: Auth - Register (Should fail with empty data)
test_endpoint "Register Endpoint" "POST" "/api/auth/register" "400"

# Test 7: Protected Route (Should fail without auth)
test_endpoint "Dashboard (Protected)" "GET" "/api/dashboard/stats" "401"

# Test 8: Admin Route (Should fail without auth)
test_endpoint "Admin Route (Protected)" "GET" "/api/admin/users" "401"

# Test 9: Upload endpoint (Should fail without auth)
test_endpoint "Upload Endpoint (Protected)" "POST" "/api/upload/image" "401"

# Test 10: AI endpoint (Should fail without auth)
test_endpoint "AI Generate Description (Protected)" "POST" "/api/ai/generate-description" "401"

echo "======================================="
echo "📊 Test Summary"
echo "======================================="
echo -e "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
echo -e "${RED}Failed:       $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo ""
    echo "✅ Your API is working correctly!"
    echo ""
    echo "Next steps:"
    echo "1. Test login from frontend"
    echo "2. Create test user and verify authentication"
    echo "3. Test file uploads"
    echo "4. Monitor logs for any errors"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed${NC}"
    echo ""
    echo "Common issues:"
    echo "- Database not seeded (run: bash seed-database.sh)"
    echo "- Environment variables missing"
    echo "- Service dependencies not running (Redis, PostgreSQL)"
    echo ""
    echo "Check the errors above and Coolify logs for details"
    exit 1
fi
