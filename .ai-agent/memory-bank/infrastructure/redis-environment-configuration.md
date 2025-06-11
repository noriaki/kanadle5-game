# Redis Environment Configuration Plan

## Overview

This document outlines the comprehensive Redis configuration strategy for the Kanadle5 Game across all development, testing, and production environments. The configuration ensures complete environment isolation, data safety, and efficient development workflows.

## Environment Architecture

### Environment Matrix

| Environment | Type | Redis Connection | Database | Purpose |
|------------|------|------------------|----------|---------|
| **Local Development** | devcontainer | Local Redis Container | DB0 | Feature development & debugging |
| **Local Test** | devcontainer | Local Redis Container | DB1 | Unit & Integration testing |
| **GitHub Actions** | CI/CD | Redis Service Container | DB0 | Automated testing |
| **Vercel Production** | Production | Upstash `kanadle5-game` | - | Live application |
| **Vercel Preview** | Staging | Upstash `kanadle5-game-preview` | - | PR previews & testing |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Redis Environment Setup                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  LOCAL ENVIRONMENTS (devcontainer)                          │
│  ┌─────────────────────────────────────────┐               │
│  │  Redis:7-alpine Container               │               │
│  │  ├─ DB0: Development (.env.development.local)           │
│  │  └─ DB1: Testing (.env.test.local)      │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  REMOTE ENVIRONMENTS                                        │
│  ┌──────────────────┐  ┌───────────────────────────────┐  │
│  │  GitHub Actions  │  │  Vercel (Upstash)              │  │
│  │  Redis Service   │  │  ├─ Production: kanadle5-game  │  │
│  │  Container       │  │  └─ Preview: kanadle5-game-    │  │
│  └──────────────────┘  │              preview            │  │
│                        └───────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Configuration Details

### 1. Local Development Environment

**Configuration File**: `.env.development.local`
```bash
# Redis Configuration for Local Development
KV_REST_API_URL=http://localhost:6379
KV_REST_API_TOKEN=local-dev-token
REDIS_DB=0

# Other development configs
NEXT_PUBLIC_LIFF_ID=dev-liff-id
```

**Purpose**: 
- Feature development
- Real-time debugging
- Browser-based testing

### 2. Local Test Environment

**Configuration File**: `.env.test.local`
```bash
# Redis Configuration for Local Testing
KV_REST_API_URL=http://localhost:6379
KV_REST_API_TOKEN=local-test-token
REDIS_DB=1

# Test-specific configs
NODE_ENV=test
```

**Purpose**:
- Unit tests (with mocks)
- Integration tests (with real Redis)
- Isolated test data

### 3. GitHub Actions Environment

**Configuration**: `.github/workflows/ci.yml`
```yaml
services:
  redis:
    image: redis:7-alpine
    options: >-
      --health-cmd "redis-cli ping"
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    ports:
      - 6379:6379

env:
  KV_REST_API_URL: http://localhost:6379
  KV_REST_API_TOKEN: github-actions-token
```

**Purpose**:
- Automated CI/CD testing
- Pull request validation
- Pre-merge checks

### 4. Vercel Production Environment

**Database**: `upstash-kv-kanadle5-game`
- Already configured in Vercel Dashboard
- Connected to Production deployments
- Environment variables managed through Vercel

### 5. Vercel Preview Environment

**Database**: `upstash-kv-kanadle5-game-preview` (to be created)
- Separate Upstash instance for preview deployments
- Prevents test data pollution in production
- Environment variables for Preview context only

## Testing Strategy

### Unit Tests
- **Scope**: Individual functions and components
- **Redis**: Mocked using Jest
- **Execution**: Every commit
- **Example**: `validateWord.test.ts`

### Integration Tests
- **Scope**: System component interactions
- **Redis**: Real connection to Redis container
- **Execution**: Important changes, pre-merge
- **Example**: `getDailyWord.integration.test.ts`

### Test Organization
```
src/
├── lib/
│   ├── game/
│   │   ├── validateWord.test.ts        # Unit test (mock)
│   │   └── validateWord.integration.test.ts  # Integration test (real Redis)
│   └── redis.test.ts                    # Unit test (mock)
└── __tests__/
    └── integration/
        └── daily-word-system.test.ts   # Full system integration test
```

## Implementation Checklist

### User Actions Required

1. **Create Upstash Preview Database**
   - [ ] Log into Upstash Dashboard
   - [ ] Create new database: `upstash-kv-kanadle5-game-preview`
   - [ ] Copy connection credentials

2. **Configure Vercel Preview Environment**
   - [ ] Navigate to Vercel Project Settings
   - [ ] Add Preview-only environment variables:
     - `KV_REST_API_URL`: [Preview DB URL]
     - `KV_REST_API_TOKEN`: [Preview DB Token]

3. **Set Up GitHub Repository Secrets** (if using real Upstash for CI)
   - [ ] Add `KV_REST_API_URL_TEST`
   - [ ] Add `KV_REST_API_TOKEN_TEST`

### Development Team Actions

1. **devcontainer Configuration**
   - [ ] Create `.devcontainer/docker-compose.yml` with Redis service
   - [ ] Update `.devcontainer/devcontainer.json`
   - [ ] Add Redis health checks

2. **Environment Files**
   - [ ] Create `.env.development.local` template
   - [ ] Create `.env.test.local` template
   - [ ] Update `.env.local.example` with new structure

3. **Redis Connection Adapter**
   - [ ] Extend `src/lib/redis.ts` for local Redis support
   - [ ] Add Upstash-compatible command mapping
   - [ ] Implement database selection logic

4. **CI/CD Updates**
   - [ ] Update `.github/workflows/ci.yml` with Redis service
   - [ ] Add integration test job
   - [ ] Configure test splitting

5. **Test Infrastructure**
   - [ ] Configure Jest projects for unit/integration separation
   - [ ] Create integration test utilities
   - [ ] Add test data cleanup helpers

## Security Considerations

1. **Environment Variable Management**
   - Never commit `.env.*.local` files
   - Use different tokens for each environment
   - Implement read-only tokens where possible

2. **Data Isolation**
   - Complete separation between environments
   - No production data in development/test
   - Regular cleanup of test data

3. **Access Control**
   - Minimal permissions principle
   - Separate credentials per environment
   - Audit trail for production access

## Benefits

1. **Development Efficiency**
   - Fast local Redis connection
   - No external dependencies for development
   - Quick feedback loops

2. **Testing Confidence**
   - Both unit and integration test coverage
   - Consistent test environments
   - Isolated test data

3. **Production Safety**
   - No development impact on production
   - Preview changes without risk
   - Clear environment boundaries

## Maintenance

1. **Regular Tasks**
   - Monitor Upstash usage and limits
   - Clean up old test data
   - Update Redis versions in containers

2. **Documentation**
   - Keep environment variables documented
   - Update this plan with changes
   - Maintain setup guides for new developers

## Future Enhancements

1. **Advanced Features**
   - Redis cluster support for scaling
   - Read replicas for performance
   - Automated backup strategies

2. **Developer Experience**
   - One-command environment setup
   - Automated environment validation
   - Visual environment status dashboard

---

This configuration provides a robust, scalable foundation for Redis usage across all environments while maintaining security and development efficiency.