#!/bin/bash

# Billboard Management System - API Testing Script
# Tests authentication, dashboard, and client area workflows

BASE_URL="http://localhost:3001/api/v1"
ADMIN_EMAIL="admin2@maputo.gov.mz"
ADMIN_PASSWORD="Admin@2025"
CLIENT_EMAIL="cliente@gmail.com"
CLIENT_PASSWORD="Cliente@2025"

echo "========================================"
echo "Billboard Management System - API Tests"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASSED${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: $2"
        ((FAILED++))
    fi
}

echo "========================================"
echo "1️⃣  AUTHENTICATION TESTS"
echo "========================================"

# Test 1: Health Check
echo ""
echo "Test 1.1: Health Check"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    print_result 0 "Health check endpoint accessible"
else
    print_result 1 "Health check endpoint failed (HTTP $HTTP_CODE)"
fi

# Test 2: Admin Login
echo ""
echo "Test 1.2: Admin Login"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    ADMIN_ACCESS_TOKEN=$(echo "$BODY" | jq -r '.data.accessToken')
    ADMIN_REFRESH_TOKEN=$(echo "$BODY" | jq -r '.data.refreshToken')
    
    if [ "$ADMIN_ACCESS_TOKEN" != "null" ] && [ "$ADMIN_REFRESH_TOKEN" != "null" ]; then
        print_result 0 "Admin login successful with access + refresh tokens"
        echo "   Access Token: ${ADMIN_ACCESS_TOKEN:0:20}..."
        echo "   Refresh Token: ${ADMIN_REFRESH_TOKEN:0:20}..."
    else
        print_result 1 "Admin login missing tokens"
    fi
else
    print_result 1 "Admin login failed (HTTP $HTTP_CODE)"
fi

# Test 3: Refresh Token
echo ""
echo "Test 1.3: Refresh Access Token"
if [ -n "$ADMIN_REFRESH_TOKEN" ]; then
    REFRESH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/refresh" \
        -H "Content-Type: application/json" \
        -d "{\"refreshToken\":\"$ADMIN_REFRESH_TOKEN\"}")
    
    HTTP_CODE=$(echo "$REFRESH_RESPONSE" | tail -n1)
    BODY=$(echo "$REFRESH_RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        NEW_ACCESS_TOKEN=$(echo "$BODY" | jq -r '.data.accessToken')
        if [ "$NEW_ACCESS_TOKEN" != "null" ]; then
            print_result 0 "Refresh token generated new access token"
            echo "   New Access Token: ${NEW_ACCESS_TOKEN:0:20}..."
        else
            print_result 1 "Refresh token response missing accessToken"
        fi
    else
        print_result 1 "Refresh token failed (HTTP $HTTP_CODE)"
    fi
else
    print_result 1 "Refresh token test skipped (no refresh token from login)"
fi

# Test 4: Get Profile
echo ""
echo "Test 1.4: Get User Profile"
if [ -n "$ADMIN_ACCESS_TOKEN" ]; then
    PROFILE_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/auth/profile" \
        -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN")
    
    HTTP_CODE=$(echo "$PROFILE_RESPONSE" | tail -n1)
    BODY=$(echo "$PROFILE_RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        USER_ROLE=$(echo "$BODY" | jq -r '.data.role')
        USER_EMAIL=$(echo "$BODY" | jq -r '.data.email')
        print_result 0 "Get profile successful"
        echo "   Email: $USER_EMAIL"
        echo "   Role: $USER_ROLE"
    else
        print_result 1 "Get profile failed (HTTP $HTTP_CODE)"
    fi
else
    print_result 1 "Get profile test skipped (no access token)"
fi

echo ""
echo "========================================"
echo "2️⃣  DASHBOARD TESTS"
echo "========================================"

# Test 5: Admin Dashboard
echo ""
echo "Test 2.1: Admin Dashboard"
if [ -n "$ADMIN_ACCESS_TOKEN" ]; then
    DASHBOARD_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/dashboard" \
        -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN")
    
    HTTP_CODE=$(echo "$DASHBOARD_RESPONSE" | tail -n1)
    BODY=$(echo "$DASHBOARD_RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        TOTAL_BILLBOARDS=$(echo "$BODY" | jq -r '.data.billboards.total')
        TOTAL_PAYMENTS=$(echo "$BODY" | jq -r '.data.payments.validated')
        TOTAL_CLIENTS=$(echo "$BODY" | jq -r '.data.clients.total')
        
        if [ "$TOTAL_BILLBOARDS" != "null" ]; then
            print_result 0 "Admin dashboard accessible with statistics"
            echo "   Total Billboards: $TOTAL_BILLBOARDS"
            echo "   Validated Payments: $TOTAL_PAYMENTS"
            echo "   Total Clients: $TOTAL_CLIENTS"
        else
            print_result 1 "Admin dashboard response missing data"
        fi
    else
        print_result 1 "Admin dashboard failed (HTTP $HTTP_CODE)"
    fi
else
    print_result 1 "Admin dashboard test skipped (no access token)"
fi

# Test 6: Admin-specific Dashboard Endpoint
echo ""
echo "Test 2.2: Admin-Specific Dashboard Endpoint"
if [ -n "$ADMIN_ACCESS_TOKEN" ]; then
    ADMIN_DASHBOARD_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/dashboard/admin" \
        -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN")
    
    HTTP_CODE=$(echo "$ADMIN_DASHBOARD_RESPONSE" | tail -n1)
    BODY=$(echo "$ADMIN_DASHBOARD_RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        print_result 0 "Admin-specific dashboard endpoint accessible"
    else
        print_result 1 "Admin-specific dashboard failed (HTTP $HTTP_CODE)"
    fi
else
    print_result 1 "Admin dashboard endpoint test skipped (no access token)"
fi

echo ""
echo "========================================"
echo "3️⃣  DATA ACCESS TESTS"
echo "========================================"

# Test 7: List Billboards
echo ""
echo "Test 3.1: List Billboards"
if [ -n "$ADMIN_ACCESS_TOKEN" ]; then
    BILLBOARDS_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/billboards" \
        -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN")
    
    HTTP_CODE=$(echo "$BILLBOARDS_RESPONSE" | tail -n1)
    BODY=$(echo "$BILLBOARDS_RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        BILLBOARD_COUNT=$(echo "$BODY" | jq '.data | length')
        print_result 0 "List billboards successful"
        echo "   Billboards found: $BILLBOARD_COUNT"
    else
        print_result 1 "List billboards failed (HTTP $HTTP_CODE)"
    fi
else
    print_result 1 "List billboards test skipped (no access token)"
fi

# Test 8: List Payments
echo ""
echo "Test 3.2: List Payments"
if [ -n "$ADMIN_ACCESS_TOKEN" ]; then
    PAYMENTS_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/payments" \
        -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN")
    
    HTTP_CODE=$(echo "$PAYMENTS_RESPONSE" | tail -n1)
    BODY=$(echo "$PAYMENTS_RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        PAYMENT_COUNT=$(echo "$BODY" | jq '.data | length')
        print_result 0 "List payments successful"
        echo "   Payments found: $PAYMENT_COUNT"
    else
        print_result 1 "List payments failed (HTTP $HTTP_CODE)"
    fi
else
    print_result 1 "List payments test skipped (no access token)"
fi

# Test 9: List Notifications
echo ""
echo "Test 3.3: List Notifications"
if [ -n "$ADMIN_ACCESS_TOKEN" ]; then
    NOTIFICATIONS_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/notifications" \
        -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN")
    
    HTTP_CODE=$(echo "$NOTIFICATIONS_RESPONSE" | tail -n1)
    BODY=$(echo "$NOTIFICATIONS_RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        NOTIFICATION_COUNT=$(echo "$BODY" | jq '.data | length')
        print_result 0 "List notifications successful"
        echo "   Notifications found: $NOTIFICATION_COUNT"
    else
        print_result 1 "List notifications failed (HTTP $HTTP_CODE)"
    fi
else
    print_result 1 "List notifications test skipped (no access token)"
fi

# Test 10: Audit Logs
echo ""
echo "Test 3.4: Access Audit Logs"
if [ -n "$ADMIN_ACCESS_TOKEN" ]; then
    AUDIT_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/audit" \
        -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN")
    
    HTTP_CODE=$(echo "$AUDIT_RESPONSE" | tail -n1)
    BODY=$(echo "$AUDIT_RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        AUDIT_COUNT=$(echo "$BODY" | jq '.data | length')
        print_result 0 "Access audit logs successful"
        echo "   Audit logs found: $AUDIT_COUNT"
    else
        print_result 1 "Access audit logs failed (HTTP $HTTP_CODE)"
    fi
else
    print_result 1 "Audit logs test skipped (no access token)"
fi

echo ""
echo "========================================"
echo "📊 TEST SUMMARY"
echo "========================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the output above for details.${NC}"
    exit 1
fi
