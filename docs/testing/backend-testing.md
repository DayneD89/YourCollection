# Backend Test Script

This directory contains a comprehensive test script for the backend API that validates all functionality without affecting production data.

## Overview

The backend tests in the consolidated `test/` directory test all backend functionality including:

- ✅ **Authentication**: Login with weak/strong passwords, password validation
- ✅ **User Management**: Create, list, and delete users (admin operations)
- ✅ **Password Operations**: Reset passwords (admin), change passwords (users)
- ✅ **Authorization**: Role-based access control
- ✅ **Token Management**: JWT token validation and verification

## Features

- **Self-Contained**: Creates its own test users and cleans them up
- **Zero Side Effects**: No production data is affected
- **Comprehensive**: Tests all API endpoints and error scenarios
- **Clean Output**: Color-coded results with clear pass/fail indicators
- **Graceful Cleanup**: Handles interruptions and ensures cleanup

## Prerequisites

Before running the tests:

1. **Backend must be running** on `http://localhost:3001` (or set `API_BASE_URL`)
2. **Admin user must have a strong password**:
   ```bash
   # Update admin password in database (example)
   docker exec -i yourpartycollection-postgres psql -U postgres -d party_collection -c "UPDATE users SET password_hash = crypt('AdminTest123@', gen_salt('bf')) WHERE email = 'admin@example.com';"
   ```

## Usage

### Basic Usage
```bash
cd /path/to/yourpartycollection
npm test
```

### Backend Only Tests
```bash
cd /path/to/yourpartycollection/test
node runner.js
```

### With Custom Configuration
```bash
# Custom API URL
API_BASE_URL=http://localhost:3001 npm test

# Custom admin credentials
ADMIN_EMAIL=admin@company.com ADMIN_PASSWORD=SecureAdminPass123@ npm test
```

## Test Categories

### 1. Admin Authentication Setup
- Verifies admin can login with strong password
- Obtains admin token for subsequent tests

### 2. User Creation Tests
- Creates test users with various roles and password strengths
- Tests user creation validation

### 3. Password Strength Validation
- Tests login with weak passwords (should require password change)
- Tests login with strong passwords (should allow normal access)
- Validates password requirements enforcement

### 4. Password Change Functionality
- Tests password change with weak new password (should fail)
- Tests password change with strong new password (should succeed)
- Validates password change authentication

### 5. Admin-Only Operations
- Tests user listing (admin endpoint)
- Tests password reset functionality (admin endpoint)
- Tests authorization (non-admin denied access)

### 6. Token Verification
- Tests valid JWT token verification
- Tests invalid token rejection

## Sample Output

```
🚀 Starting Backend Test Suite
==================================================
ℹ️  🔐 Testing admin authentication...
✅ PASS: Admin authentication successful
ℹ️  👥 Testing user creation...
✅ PASS: Created test user: test-weak@example.com
✅ PASS: Created test user: test-strong@example.com
✅ PASS: Created test user: test-admin@example.com
ℹ️  🔒 Testing password strength validation...
✅ PASS: Weak password correctly triggers password change requirement
✅ PASS: Strong password allows normal login
ℹ️  🔄 Testing password change functionality...
✅ PASS: Password change correctly rejects weak new password
✅ PASS: Password change succeeds with strong new password
ℹ️  👑 Testing admin-only operations...
✅ PASS: Admin can list users
✅ PASS: Admin can reset user password
✅ PASS: Non-admin user correctly denied admin operations
ℹ️  🎫 Testing token verification...
✅ PASS: Valid token verification succeeds
✅ PASS: Invalid token verification fails correctly
ℹ️  🧹 Cleaning up test data...
✅ Cleaned up user: 01606a1b-eb75-4993-bda8-ea514cb5f9ea
✅ Cleaned up user: 4b0e8f37-cfc8-4a4d-beff-7373d43a9e80
✅ Cleaned up user: cd3190c1-71ea-4f33-a8f7-07d7b6f459df
✅ Cleanup completed
==================================================
📊 Test Results Summary
Total Tests: 13
✅ Passed: 13
Duration: 0.09s
✅ 🎉 All tests passed! Backend is working correctly.
```

## Exit Codes

- `0`: All tests passed
- `1`: One or more tests failed or error occurred

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://localhost:3001` | Backend API URL |
| `ADMIN_EMAIL` | `admin@example.com` | Admin user email |
| `ADMIN_PASSWORD` | `AdminTest123@` | Admin user password |

## Troubleshooting

### "Admin authentication failed"
- Ensure admin user exists in database
- Ensure admin has a strong password that meets requirements:
  - At least 8 characters
  - Contains a number
  - Contains a special character
  - Not same as email prefix

### "Network error" or connection issues
- Ensure backend server is running on the expected port
- Check `API_BASE_URL` if using custom URL
- Verify database is accessible

### Tests fail but cleanup succeeds
- Individual test failures don't prevent cleanup
- Review specific error messages for debugging
- Check backend logs for detailed error information

## Integration with CI/CD

Add to your CI/CD pipeline:

```bash
# Start backend services
./start-local.sh

# Wait for services to be ready
sleep 10

# Run tests
npm test

# Capture exit code
if [ $? -eq 0 ]; then
  echo "✅ Backend tests passed"
else
  echo "❌ Backend tests failed"
  exit 1
fi
```

## Test Data

The script creates temporary test users:
- `test-weak@example.com` - User with intentionally weak password
- `test-strong@example.com` - User with strong password  
- `test-admin@example.com` - Admin user for testing admin operations

All test users are automatically cleaned up after tests complete, regardless of pass/fail status.