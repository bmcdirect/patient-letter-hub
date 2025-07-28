# Package Scripts Documentation

## CI Script Implementation

Since package.json cannot be modified directly in this environment, the CI functionality has been implemented as a standalone script.

### Available Scripts

1. **CI Check Script**: `./ci-check.sh`
   - Runs health endpoint smoke test
   - Tests practices endpoint availability  
   - Runs Drizzle schema validation
   - Exits with code 0 on success, 1 on failure

### Usage

To run CI checks manually:
```bash
./ci-check.sh
```

To run development server with CI checks:
```bash
./dev-with-ci.sh
```

To integrate with automated workflows, the script can be called as:
```bash
bash ci-check.sh && npm run dev
```

### Automatic CI Integration

Created `./dev-with-ci.sh` script that combines CI checks with development server startup:
- Runs CI checks first (health, practices, schema validation)
- Only starts development server if all checks pass
- Provides clear feedback for each test phase
- Exits with non-zero code if any check fails

### Equivalent Package.json Script

If package.json could be modified, the following would be added:
```json
{
  "scripts": {
    "ci": "bash ci-check.sh",
    "test": "npx jest tests/multiTenantSmoke.test.ts --passWithNoTests",
    "dev:ci": "bash ci-check.sh && npm run dev"
  }
}
```

### Implementation Details

- Health check validates `/api/auth/health` returns 200 status
- Practices endpoint test ensures `/api/auth/practices` is accessible
- Drizzle schema check validates database schema integrity
- All tests must pass for CI to succeed