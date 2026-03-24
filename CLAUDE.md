# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start serverless offline with hot-reload
pnpm build            # TypeScript compilation
pnpm lint             # Run ESLint
pnpm lint:fix         # Run ESLint with auto-fix
pnpm test             # Run Vitest in watch mode
pnpm test:run         # Run Vitest once (CI)
pnpm test:coverage    # Run with coverage report
pnpm db:start         # Start local DynamoDB via Docker
pnpm db:stop          # Stop local DynamoDB
pnpm db:create-tables # Create tables in local DynamoDB
pnpm docs:gen         # Generate openapi.yaml from Zod schemas
pnpm docs:preview     # Preview OpenAPI docs at port 4000
pnpm deploy           # Deploy to AWS dev stage
pnpm deploy:prod      # Deploy to AWS prod stage
```

Run a single test file:
```bash
pnpm test src/services/user/__tests__/userService.test.ts
```

## Architecture

AWS Serverless REST API (TypeScript, Serverless Framework, DynamoDB) following clean/onion architecture.

**Request flow:**
```
API Gateway → Middy Middleware → Lambda Handler → Service → Repository → DynamoDB
```

**Middleware stack** (defined in `src/middleware/api.ts`):
- before: `httpJsonBodyParser` → `zodValidation`
- after: `zodValidationResponse` → `responseMiddleware`
- error: `errorHandler`

**Layers:**
- `src/handlers/user/` — Lambda entry points; register OpenAPI metadata via `restApiHandler` wrapper
- `src/services/user/` — Business logic; framework-agnostic
- `src/repositories/user/` — DynamoDB data access (CRUD + queries)
- `src/schemas/user/` — Zod schemas; single source of truth for validation AND OpenAPI docs
- `src/docs/` — OpenAPI registry singleton + generation scripts
- `src/clients/dynamoClient.ts` — DynamoDB client (switches between local/remote via `IS_OFFLINE`)
- `src/utils/errors.ts` — `AppError` class with factory methods

**OpenAPI generation:** Handlers auto-register routes at module load time → `pnpm docs:gen` writes `openapi.yaml`.

## DynamoDB Table

Table name: `aws-serverless-infrastructure-users-{stage}`
- PK: `USER#{id}`, SK: `PROFILE`
- GSI: `EmailIndex` on `Email` attribute

## Path Aliases

```
@@handlers      → src/handlers
@@clients       → src/clients
@@schemas       → src/schemas
@@repositories  → src/repositories
@@middleware    → src/middleware
@@services      → src/services
@@utils         → src/utils
```

## Environment

Copy `.env.example` to `.env` for local dev. Key variables:
- `IS_OFFLINE=true` — enables local DynamoDB
- `DYNAMODB_ENDPOINT=http://localhost:8000`
- `API_URL_LOCAL/DEV/PROD` — used in OpenAPI spec generation

Local dev requires Docker running for DynamoDB (`pnpm db:start` before `pnpm dev`).
