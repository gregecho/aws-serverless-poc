# AWS Serverless Modernization Infrastructure (TypeScript)

> **A production-ready Serverless architecture utilizing TypeScript, Middy, and DynamoDB, following Onion/Clean Architecture principles.**

---

## 📖 Project Overview

This project is a high-quality **Infrastructure** built with the **Serverless Framework**. It demonstrates how to build maintainable, scalable, and testable cloud-native applications on AWS.

Beyond a simple Lambda function, this repository showcases a robust enterprise-grade structure focusing on **separation of concerns**, **runtime validation**, and **automated testing**.

### Key Features

- **Onion Architecture**: Strict separation between Handlers, Services, and Repositories.
- **Type Safety**: End-to-end TypeScript implementation with **Zod** for runtime schema validation.
- **Robust Middleware**: Powered by **Middy** for centralized JSON parsing, input validation, and standardized error handling.
- **Comprehensive Testing**: Full test suite using **Vitest** with local DynamoDB mocking.
- **Local DynamoDB**: Full offline development support via `serverless-dynamodb`.
- **Auto CRUD**: Generic `createCrudHandlers` factory for zero-boilerplate CRUD operations.
- **OpenAPI Integration**: Schema-first API documentation auto-generated from Zod schemas.

---

## 🏗️ Architecture Design

The project follows the **Onion/Clean Architecture** pattern to ensure the business logic remains independent of external infrastructure (AWS SDK, Database).

### Data Flow

```
API Gateway ➔ Middy Middleware ➔ Lambda Handler ➔ Service Layer ➔ Repository Layer ➔ DynamoDB
```

- **Handler Layer**: Pure entry point. Adapts API Gateway events and manages middleware.
- **Service Layer**: The "Brain." Contains core business logic and rules.
- **Repository Layer**: Data access abstraction. Interacts with the DynamoDB client.
- **Middleware Stack**: Handles cross-cutting concerns (Validation, HTTP Error Formatting).

### Middleware Execution Order

```
before: httpJsonBodyParser → zodValidation → handler
after:  zodValidationResponse → responseMiddleware  (reverse registration order)
error:  errorHandler
```

---

## 🛠️ Tech Stack

| Category           | Technology                           |
| :----------------- | :----------------------------------- |
| **Language**       | TypeScript                           |
| **Framework**      | Serverless Framework v4              |
| **Middleware**     | Middy (@middy/core)                  |
| **Validation**     | Zod                                  |
| **Database**       | AWS DynamoDB (@aws-sdk/lib-dynamodb) |
| **Testing**        | Vitest, Faker.js                     |
| **Local DynamoDB** | serverless-dynamodb                  |
| **Logging**        | AWS Lambda Powertools Logger         |
| **Docs**           | Redocly + zod-to-openapi             |

---

## 📂 Project Structure

```text
src/
├── clients/          # AWS Client initializations (DynamoDB, etc.)
├── docs/             # OpenAPI documentation
│   ├── openapi.ts    # Central aggregator for all routes
│   ├── gen-docs.ts   # CLI script for file generation
│   ├── registry.ts   # Global OpenAPI registry singleton
│   └── user.docs.ts  # API path definitions per module
├── handlers/         # Lambda entry points
│   └── user/
│       ├── index.ts              # CRUD handler exports
│       └── user.serverless.ts    # Serverless function definitions
├── middleware/       # Middy middleware stack
│   └── api.ts        # restApiHandler, zodValidation, errorHandler
├── services/         # Business logic layer (framework-agnostic)
├── repositories/     # Data access layer (persistence logic)
├── schemas/          # Zod validation schemas
├── utils/            # Helpers and error definitions
└── tests/            # Unit & integration test suites

requests/             # Bruno/REST Client API request collections
├── user.http
└── .env.example
```

---

## 🚀 Quick Start

### 1. Installation

```bash
pnpm db:start        # Start local dynamoDB
pnpm db:create-tables # Create table in local dynamoDB
```

### 2. ⚙️ Environment Configuration

This project uses `.env` files to manage environment-specific variables.  
Serverless Framework reads `.env` and injects values into Lambda via `serverless.ts`.

```
.env  →  serverless.ts (${env:KEY})  →  Lambda process.env
```

### File Convention

| File           | Purpose             | Git             |
| :------------- | :------------------ | :-------------- |
| `.env`         | Local development   | ❌ Never commit |
| `.env.dev`     | AWS dev deployment  | ❌ Never commit |
| `.env.prod`    | AWS prod deployment | ❌ Never commit |
| `.env.example` | Template for team   | ✅ Commit       |

### Setup

```bash
cp .env.example .env
```

```bash
# .env — Local development
IS_OFFLINE=true
DYNAMODB_ENDPOINT=http://localhost:8000
AWS_REGION=us-east-1
```

> ⚠️ `DYNAMODB_ENDPOINT` must be set for local DynamoDB (Docker).  
> In AWS deployments, leave it empty — Lambda uses IAM Role credentials automatically.

### Variable Reference

| Variable            | Local                   | Dev         | Prod        | Description                                     |
| :------------------ | :---------------------- | :---------- | :---------- | :---------------------------------------------- |
| `USERS_TABLE`       | auto                    | auto        | auto        | Generated by serverless.ts, do not set manually |
| `IS_OFFLINE`        | `true`                  | `false`     | `false`     | Enables local DynamoDB mode                     |
| `DYNAMODB_ENDPOINT` | `http://localhost:8000` | _(empty)_   | _(empty)_   | Local DynamoDB endpoint                         |
| `AWS_REGION`        | `us-east-1`             | `us-east-1` | `us-east-1` | AWS region                                      |

### Deployment

```bash
# Dev — reads .env.dev
pnpm deploy

# Prod — reads .env.prod
pnpm deploy:prod
```

### 3. Local Development

```bash
# Start with hot-reload
pnpm dev

# Start with verbose logging
pnpm dev --verbose
```

On startup you should see:

```
DynamoDB Local Started on port 8000
serverless-dynamodb: Migration ran for table: aws-serverless-infrastructure-users-dev ✓
offline: POST http://localhost:3000/dev/users
offline: GET  http://localhost:3000/dev/users/{id}
offline: GET  http://localhost:3000/dev/users
offline: PATCH http://localhost:3000/dev/users/{id}
offline: DELETE http://localhost:3000/dev/users/{id}
```

### 4. Local Debugging

**Option A — VS Code JavaScript Debug Terminal (Recommended, zero config)**

```
1. Open Run and Debug panel (⇧⌘D)
2. Click "JavaScript Debug Terminal"
3. Run: pnpm dev
4. Set breakpoints → send a request → execution pauses automatically
```

### 5. Verify Local DynamoDB

```bash
# List tables
AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local \
  aws dynamodb list-tables \
  --endpoint-url http://localhost:8000 \
  --region us-east-1

# Expected
# { "TableNames": ["aws-serverless-infrastructure-users-dev"] }
```

### 6. Deployment

```bash
# Deploy to dev
pnpm deploy

# Deploy to production
pnpm deploy:prod
```

### 7. OpenAPI Docs

```bash
# Generate spec → openapi.yaml
pnpm docs:gen

# Live preview at http://localhost:4000
pnpm docs:preview

# Build standalone index.html
pnpm docs:build
```

---

## 🧩 API Endpoints

| Method   | Path          | Description    |
| :------- | :------------ | :------------- |
| `POST`   | `/users`      | Create user    |
| `GET`    | `/users/{id}` | Get user by ID |
| `GET`    | `/users`      | List users     |
| `PATCH`  | `/users/{id}` | Update user    |
| `DELETE` | `/users/{id}` | Delete user    |

---

## ⚠️ Error Handling

All error responses follow a consistent structure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [...]
  }
}
```

| Status | Code                 | Description             |
| :----- | :------------------- | :---------------------- |
| `400`  | `VALIDATION_ERROR`   | Zod schema violation    |
| `400`  | `INVALID_JSON`       | Malformed request body  |
| `404`  | `RESOURCE_NOT_FOUND` | Entity does not exist   |
| `500`  | `INTERNAL_ERROR`     | Unexpected server error |

---

## 🧪 Testing Strategy

```bash
pnpm test             # Watch mode
pnpm test:run         # CI mode (run once and exit)
pnpm test:coverage    # With coverage report
pnpm test:ui          # Visual UI
```

We employ a dual-layered testing strategy:

- **Unit Tests**: Focus on the Service Layer. Dependencies like DynamoDB are isolated using `vi.mock`.
- **Integration Tests**: Test the Lambda Handler end-to-end including Middy middleware behavior (validation, parsing, error interception).
- **Mocking**: Utilizes Faker.js for realistic data generation and `vi.spyOn` for dependency tracking.

---

## 📁 API Documentation (OpenAPI)

This project implements a **Schema-First (Zod)** development workflow. API definitions, request validations, and documentation are synchronized using [Zod](https://zod.dev/) and [@asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi).

This ensures **100% consistency** between the TypeScript source code and the generated OpenAPI specification.

---

## 📋 Monitoring & Logs

```bash
# Tail logs for a specific deployed handler
pnpm logs user-create --tail
pnpm logs user-get --tail

# Filter for errors only
aws logs tail /aws/lambda/aws-serverless-infrastructure-dev-user-create \
  --follow \
  --filter-pattern "ERROR"
```

---

### 🚀 Core Workflow

1. **Define Schemas**: Create Zod models in `src/schemas/`.
2. **Register Routes**: Define API metadata (Method, Path, Tags) in `src/docs/`.
3. **Generate Spec**: Run the export script to convert TypeScript definitions into `openapi.yaml`.
4. **Preview/Build**: Render the YAML into an interactive HTML documentation via Redocly.

---

### 📝 Development Guide

#### 1. Adding a New Endpoint

1. Create a `.docs.ts` file in `src/docs/` (e.g., `user.docs.ts`).
2. Use `registry.registerPath({...})` to define the endpoint's metadata.
3. **Crucial**: Import this file in `src/docs/openapi.ts` to include it in the final bundle.

#### 2. Schema Reusability & Components

Leverage Zod's `extend` or `partial` patterns combined with `.openapi('Name')` to ensure schemas are reusable and named correctly in the documentation:

```typescript
// Base Model
const BaseUser = z
  .object({
    name: z.string(),
    email: z.string().email(),
  })
  .openapi('BaseUser');

// Response Model (Inherits fields and displays as a reference)
const UserResponse = BaseUser.extend({
  id: z.string().uuid(),
}).openapi('UserResponse');
```

## 📈 Roadmap & TODOs

- [x] Onion/Clean Architecture
- [x] Zod runtime validation (request + response)
- [x] Centralized error handling middleware
- [x] Standardized error response schemas
- [x] Local DynamoDB via Docker
- [x] OpenAPI documentation auto-generated from Zod schemas
- [ ] Logging — Structured logging with AWS Lambda Powertools
- [ ] Observability — AWS X-Ray distributed tracing
- [ ] Security — AWS Secrets Manager integration
- [ ] SQS — Async decoupling for background tasks
- [ ] Lambda Power Tuning — Memory/cost benchmarking
- [ ] Auto OpenAPI registration in middleware
- [ ] OpenAPI auto deployment and swith envs
