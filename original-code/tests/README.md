# Jest Testing Setup for PatientLetterHub

## Overview
This directory contains the Jest testing setup for PatientLetterHub with TypeScript support.

## Setup Completed
- ✅ Jest installed with TypeScript support
- ✅ TypeScript definitions (@types/jest) installed
- ✅ Jest configuration file (jest.config.cjs) created
- ✅ tsconfig.json updated with Jest types
- ✅ Test directory structure created

## Configuration Files
- `jest.config.cjs` - Jest configuration for ES modules compatibility
- `tsconfig.json` - Updated to include Jest types

## Running Tests
```bash
# Run all tests
npx jest --config jest.config.cjs

# Run specific test file
npx jest tests/test-file.test.ts --config jest.config.cjs

# Run with verbose output
npx jest --config jest.config.cjs --verbose
```

## Test Structure
Tests should be placed in the `tests/` directory with the following naming convention:
- `*.test.ts` - TypeScript test files
- `*.test.js` - JavaScript test files  
- `*.spec.ts` - TypeScript specification files
- `*.spec.js` - JavaScript specification files

## Available Test Files
- `multiTenantSmoke.test.ts` - Multi-tenant smoke tests
- `typescript.test.ts` - TypeScript integration tests (sample)

## Configuration Details
The Jest configuration includes:
- TypeScript support via ts-jest
- 10 second test timeout
- Node.js test environment
- Support for both .js and .ts test files
- Verbose output enabled

## Notes
- The project uses ES modules (type: "module"), so Jest config is in CommonJS format (.cjs)
- TypeScript compilation is handled by ts-jest preset
- All tests run in Node.js environment suitable for backend testing