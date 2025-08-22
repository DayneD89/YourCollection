# Test Tags Reference

## Overview

This document provides a complete reference for all test tags used across the Party Collection test suite. Tags enable selective test execution, parallel processing, and logical test organization.

## Core Test Category Tags

### @backend
**New Tag**: Identifies tests that directly test backend API endpoints through HTTP requests.

**Usage**:
```bash
# Run only backend API tests
TAGS="@backend" npm test

# Run fast backend tests
TAGS="@backend and @fast" npm test

# Run backend authentication tests
TAGS="@backend and @auth" npm test
```

**Coverage**: 12 feature files covering:
- Admin authentication (`backend-admin-auth.feature`)
- User creation (`backend-user-creation.feature`) 
- Password validation (`backend-password-validation.feature`)
- Password change functionality (`backend-password-change.feature`)
- Admin operations (`backend-admin-operations.feature`)
- Token verification (`backend-token-verification.feature`)
- Token expiration (`backend-token-expiration.feature`)
- Health endpoints (`backend-health-endpoints.feature`)
- Error handling (`backend-error-handling.feature`)
- Security features (`backend-security-features.feature`)
- Form data collection (`backend-form-data-collection.feature`)
- Form functionality (`backend-form-functionality.feature`)

### @auth
Authentication and authorization tests.

**Frontend Tests**: Login/logout, session management, token handling
**Backend Tests**: JWT validation, password security, user authentication

### @admin
Administrative functionality tests.

**Frontend Tests**: User management UI, admin dashboard features
**Backend Tests**: Admin-only API endpoints, user CRUD operations

### @survey
Form and survey-related functionality.

**Frontend Tests**: Dynamic form rendering, field validation, UI components
**Backend Tests**: Form schema endpoints, data collection APIs, YAML processing

## Performance and Execution Tags

### @fast 
Quick tests that complete within 10 seconds. Ideal for development feedback loops.

**Usage**: 
```bash
TAGS="@fast" npm test
```

**Count**: 96 scenarios across frontend and backend tests

### @slow
Tests that may take longer due to timeouts, API calls, or complex operations.

**Usage**:
```bash  
TAGS="@slow" npm test
```

**Count**: 34 scenarios

### @extended
Comprehensive tests covering edge cases and detailed workflows.

**Usage**:
```bash
TAGS="@extended" npm test  
```

**Count**: 38 scenarios

## Execution Mode Tags

### @parallel
Tests that can safely run in parallel without interfering with each other.

**Usage**:
```bash
PARALLEL=true TAGS="@parallel" npm test
```

**Count**: 88 scenarios

### @sequential
Tests that must run sequentially due to shared state or dependencies.

**Usage**:
```bash
PARALLEL=false TAGS="@sequential" npm test
```

**Count**: 23 scenarios

## Test Priority Tags

### @smoke
Critical path tests that verify core functionality works.

**Usage**:
```bash
TAGS="@smoke" npm test
```

**Count**: 17 scenarios covering:
- Basic authentication
- Admin user creation
- Health endpoints
- Core API functionality

### @core
Essential functionality tests that form the foundation of the system.

**Usage**:
```bash
TAGS="@core" npm test
```

**Count**: 79 scenarios

## Functional Area Tags

### @ui
User interface and visual component tests.

**Usage**:
```bash
TAGS="@ui" npm test
```

**Count**: 24 scenarios

### @security
Security-related tests including authentication, authorization, and input validation.

**Usage**:
```bash
TAGS="@security" npm test
```

**Count**: 11 scenarios

### @error
Error handling and edge case tests.

**Usage**:
```bash
TAGS="@error" npm test
```

**Count**: 18 scenarios

### @integration
Tests that verify interaction between multiple system components.

**Usage**:
```bash
TAGS="@integration" npm test
```

**Count**: 3 scenarios

## Quality and Coverage Tags

### @full
Complete test coverage including all scenarios for a feature area.

**Usage**:
```bash
TAGS="@full" npm test
```

**Count**: 134 scenarios (most comprehensive)

### @report
Tests that generate additional reporting data or require special report handling.

**Usage**:
```bash
TAGS="@report" npm test
```

**Count**: 3 scenarios

## Tag Combination Patterns

### Common Combinations

```bash
# Fast backend tests (recommended for backend development)
TAGS="@backend and @fast" npm test

# All authentication tests (frontend + backend)
TAGS="@auth" npm test

# Critical smoke tests only
TAGS="@smoke" npm test

# Comprehensive admin functionality
TAGS="@admin and @extended" npm test

# Security-focused tests
TAGS="@security" npm test

# Fast parallel tests (optimal for development)
PARALLEL=true TAGS="@fast and @parallel" npm test

# Sequential slow tests (thorough validation)
PARALLEL=false TAGS="@slow and @sequential" npm test
```

### Backend-Specific Combinations

```bash
# Backend authentication and security
TAGS="@backend and (@auth or @security)" npm test

# Backend admin operations
TAGS="@backend and @admin" npm test

# Backend error handling and edge cases  
TAGS="@backend and @error" npm test

# Fast backend smoke tests
TAGS="@backend and @smoke and @fast" npm test
```

### Frontend-Specific Combinations

```bash
# Frontend without backend tests
TAGS="not @backend" npm test

# UI and form components
TAGS="@ui and @survey" npm test

# Authentication flow (frontend only)
TAGS="@auth and not @backend" npm test
```

## Tag Usage Statistics

| Tag | Count | Percentage |
|-----|--------|------------|
| @full | 134 | 100% |
| @fast | 96 | 72% |
| @parallel | 88 | 66% |
| @core | 79 | 59% |
| @extended | 38 | 28% |
| @slow | 34 | 25% |
| @auth | 33 | 25% |
| @survey | 30 | 22% |
| @admin | 26 | 19% |
| @ui | 24 | 18% |
| @sequential | 23 | 17% |
| @error | 18 | 13% |
| @smoke | 17 | 13% |
| @security | 11 | 8% |
| @backend | 48+ | 36% (new) |

## Best Practices

### Development Testing
```bash
# Quick feedback loop during development
TAGS="@fast and @parallel" npm test

# Test specific feature area
TAGS="@auth and @fast" npm test  

# Backend API development
TAGS="@backend and @fast" npm test
```

### Pre-Deployment Testing
```bash
# Comprehensive validation
TAGS="@smoke" npm test

# Full regression testing  
TAGS="@extended" npm test

# Security validation
TAGS="@security" npm test
```

### CI/CD Pipeline Testing
```bash
# Fast pipeline feedback
PARALLEL=true TAGS="@smoke and @parallel" npm test

# Full validation before release
PARALLEL=false TAGS="@extended and @sequential" npm test
```

## Troubleshooting Tags

### Performance Issues
- Use `@fast` to isolate quick tests
- Use `@slow` to identify performance bottlenecks
- Combine with `PARALLEL=false` for timing analysis

### Flaky Tests
- Use `@sequential` to avoid race conditions
- Use `@parallel` to identify concurrency issues
- Use `DEBUG=true` for detailed logging

### Environment Issues  
- Use `@smoke` to verify basic connectivity
- Use `@health` for system status validation
- Use `@integration` for cross-component verification

## Migration Notes

### Adding New Tests
1. **Always include @backend** for API tests
2. **Add performance tags** (@fast/@slow) based on execution time
3. **Add execution tags** (@parallel/@sequential) based on dependencies
4. **Add functional tags** (@auth, @admin, @survey) for logical grouping

### Updating Existing Tests
1. **Maintain backward compatibility** with existing tag combinations
2. **Update documentation** when changing tag meanings
3. **Test tag combinations** before committing changes