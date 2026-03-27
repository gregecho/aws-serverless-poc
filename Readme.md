# AWS Serverless Modernization Infrastructure (TypeScript)

> **A production-ready Serverless architecture utilizing TypeScript, Middy, and DynamoDB, following Onion/Clean Architecture principles.**

---

## 📖 Project Overview

This project is a high-quality **Infrastructure** built with the **Serverless Framework**. It demonstrates how to build maintainable, scalable, and testable cloud-native applications on AWS.

Beyond a simple Lambda function, this repository showcases a robust enterprise-grade structure focusing on **separation of concerns**, **runtime validation**, and **automated testing**.

> AWS fundamental concepts, please refer to [aws-serverless-toturial](./documentation/aws-serverless-toturial.md).

### Key Features

- **Onion Architecture**: Strict separation between Handlers, Services, and Repositories.
- **Type Safety**: End-to-end TypeScript implementation with **Zod** for runtime schema validation.
- **Robust Middleware**: Powered by **Middy** for centralized JSON parsing, input validation, and standardized error handling.
- **Comprehensive Testing**: Full test suite using **Vitest** with local DynamoDB mocking.
- **Local DynamoDB**: Full offline development support via `serverless-dynamodb`.
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
| **AI Enrichment**  | AWS Bedrock (Claude 3 Haiku)         |
| **Testing**        | Vitest, Faker.js                     |
| **Local DynamoDB** | serverless-dynamodb                  |
| **Logging**        | AWS Lambda Powertools Logger         |
| **Tracing**        | AWS X-Ray + Lambda Powertools Tracer |
| **Docs**           | Redocly + zod-to-openapi             |

---

## 📂 Project Structure

```text
src/
├── clients/
│   └── aws.client.ts         # All AWS clients: DynamoDB, S3, SNS, Bedrock
├── docs/             # OpenAPI documentation
│   ├── openapi.ts    # Central aggregator for all routes
│   ├── gen-docs.ts   # CLI script for file generation
│   ├── registry.ts   # Global OpenAPI registry singleton
├── handlers/         # Lambda entry points
│   └── user/
│       ├── index.ts              # CRUD handler exports
│       └── user.serverless.ts    # Serverless function definitions
├── middleware/       # Middy middleware stack
│   └── api.ts        # restApiHandler, zodValidation, errorHandler
├── services/         # Business logic layer (framework-agnostic)
│   ├── ai/
│   │   ├── BedrockService.ts     # Interface
│   │   └── BedrockServiceImpl.ts # AWS Bedrock implementation
│   └── user/
│       ├── userService.ts        # Interface
│       └── userServiceImpl.ts    # Implementation
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

### Prerequisites

- Node.js >= 20.x
- pnpm >= 9.x
- Docker (for local DynamoDB)
- AWS CLI configured (`aws configure`)

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Verify
pnpm --version
```

### 1. Installation

```bash
pnpm install
```

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

#### File Convention

| File           | Purpose             | Git             |
| :------------- | :------------------ | :-------------- |
| `.env`         | Local development   | ❌ Never commit |
| `.env.dev`     | AWS dev deployment  | ❌ Never commit |
| `.env.prod`    | AWS prod deployment | ❌ Never commit |
| `.env.example` | Template for team   | ✅ Commit       |

#### Setup

```bash
cp ./src/requests/.env.example .env
```

```bash
# .env — Local development
IS_OFFLINE=true
# DYNAMODB_ENDPOINT=http://localhost:8000 # Deprecated
AWS_REGION=us-east-1
```

> ~~⚠️ `DYNAMODB_ENDPOINT` must be set for local DynamoDB (Docker).~~
> ~~In AWS deployments, leave it empty — Lambda uses IAM Role credentials automatically.~~

#### Variable Reference

| Variable                | Local                       | Dev                                                      | Prod                                                      | Description                            |
| :---------------------- | :-------------------------- | :------------------------------------------------------- | :-------------------------------------------------------- | :------------------------------------- |
| `IS_OFFLINE`            | `true`                      | `false`                                                  | `false`                                                   | Enables local DynamoDB mode            |
| ~~`DYNAMODB_ENDPOINT`~~ | ~~`http://localhost:8000`~~ | _(empty)_                                                | _(empty)_                                                 | Local DynamoDB endpoint                |
| `AWS_REGION`            | `us-east-1`                 | `us-east-1`                                              | `us-east-1`                                               | AWS region                             |
| `API_URL_LOCAL`         | `http://localhost:3000/dev` | _(empty)_                                                | _(empty)_                                                 | Local API base URL for OpenAPI docs    |
| `API_URL_DEV`           | _(empty)_                   | `https://xxxxxx.execute-api.us-east-1.amazonaws.com/dev` | _(empty)_                                                 | AWS dev API base URL for OpenAPI docs  |
| `API_URL_PROD`          | _(empty)_                   | _(empty)_                                                | `https://xxxxxx.execute-api.us-east-1.amazonaws.com/prod` | AWS prod API base URL for OpenAPI docs |

### 3. Local Development

```bash
# Start locally
pnpm dev
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
1. Open Run and Debug panel
2. Click "JavaScript Debug Terminal"
3. Run: pnpm dev
4. Set breakpoints → send a request → execution pauses automatically
```

### 5. ~~Verify Local DynamoDB~~ -- Deprecated

In order to reduce the complexity, we should use the real AWS DynamoDB(dev) for local. Also, the developing requests to AWS DynamoDB are much cheapier than expected.

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

# Deploy index.html to S3 (dev)
pnpm docs:deploy:dev

# Get the public website URL
pnpm docs:url
```

The `docs:deploy:dev` command builds the docs and uploads `index.html` to the `aws-serverless-infrastructure-docs-dev` S3 bucket, which is provisioned by `serverless.ts` as a public static website.

---

## 🧩 API Endpoints

| Method   | Path                              | Description                                    |
| :------- | :-------------------------------- | :--------------------------------------------- |
| `POST`   | `/users`                          | Create user — AI-enriched bio/tags via Bedrock |
| `GET`    | `/users/{id}`                     | Get user by ID                                 |
| `GET`    | `/users`                          | List users                                     |
| `PATCH`  | `/users/{id}`                     | Update user                                    |
| `DELETE` | `/users/{id}`                     | Delete user                                    |
| `GET`    | `/users/{id}/portrait/upload-url` | Get presigned S3 URL to upload portrait        |
| `POST`   | `/users/{id}/verify/send`         | Send email verification code via SNS           |
| `POST`   | `/users/{id}/verify/confirm`      | Confirm verification code                      |

### Portrait Upload

**1. Get presigned URL** — `GET /users/{id}/portrait/upload-url`

```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/...",
    "portraitKey": "portraits/{id}.jpg"
  }
}
```

**2. Upload directly from client** (expires in 5 minutes):

```bash
curl -X PUT "<uploadUrl>" \
  -H "Content-Type: image/jpeg" \
  --data-binary @portrait.jpg
```

**3. Save the key** — `PATCH /users/{id}` with `{ "portraitKey": "portraits/{id}.jpg" }`

### AI Profile Enrichment

When a user is created (`POST /users`), Bedrock (Claude 3 Haiku) automatically generates a `bio` and `tags` based on the user's name and email domain:

```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Jane Smith",
    "email": "jane@acme.com",
    "createdAt": "...",
    "bio": "A professional at acme.com with expertise in their field.",
    "tags": ["acme", "professional", "tech"]
  }
}
```

If Bedrock is unavailable, the user is still created — enrichment failure is non-blocking.

### Email Verification

**1. Send code** — `POST /users/{id}/verify/send`

```json
{ "email": "user@example.com" }
```

Publishes a 6-digit code to the SNS `VerificationTopic`. Subscribe an email address to the topic in the AWS console after deploying.

**2. Confirm code** — `POST /users/{id}/verify/confirm`

```json
{ "code": "123456" }
```

Validates the code (10-minute expiry) and marks the user as `EmailVerified = true` in DynamoDB.

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

### How It Works

Documentation is **automatically generated** from the same Zod schemas used for runtime validation. There is no manual OpenAPI YAML to maintain.

```
Zod Schema (single source of truth)
       ↓
restApiHandler({ body, response, openapi })
       ↓
registry.registerPath()  ← auto-called at module load time
       ↓
pnpm docs:gen → openapi.yaml
```

---

### 📝 Adding a New Endpoint

**1. Define schemas in `src/schemas/`**

```typescript
export const createUserSchema = z
  .object({
    name: z.string(),
    email: z.string().email(),
  })
  .openapi("CreateUserRequest");

export const userResponseSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    createdAt: z.string(),
  })
  .openapi("UserResponse");
```

**2. Register in handler with `openapi` metadata**

```typescript
// src/handlers/user/index.ts
export const create = restApiHandler({
  body: createUserSchema,
  response: userResponseSchema,
  openapi: {
    // ← add this block
    method: "post",
    path: "/users",
    summary: "Create user",
    tags: ["User"],
  },
}).handler(async ({ body }) => service.create(body));
```

**3. Import handler in `src/docs/openapi.ts`**

```typescript
import "@@handlers/user/index"; // ← triggers auto-registration
// import '@@handlers/order/index' ← add new resources here
```

**4. Run**

```bash
pnpm docs:preview
```

---

### Architecture

| File                        | Responsibility                                               |
| :-------------------------- | :----------------------------------------------------------- |
| `src/middleware/api.ts`     | `restApiHandler` — calls `registerOpenApiRoute` at load time |
| `src/docs/registry.ts`      | Global OpenAPI registry singleton                            |
| `src/docs/openapi.ts`       | Aggregates all handlers, generates the spec                  |
| `src/docs/gen-docs.ts`      | CLI script — writes `openapi.yaml` to disk                   |
| `src/docs/common.errors.ts` | Shared error response schemas (400/401/404/500)              |

---

### Design Principles

- **Single source of truth** — Zod schemas drive both runtime validation and API docs simultaneously.
- **Zero drift** — It is impossible for docs to be out of sync with the actual request/response validation.
- **Zero boilerplate** — No separate `.docs.ts` files to maintain. Adding `openapi: {}` to a handler is all that's needed.
- **Zero runtime cost** — `registerOpenApiRoute` executes once at module load time, never per-request.

---

## 📋 Monitoring & Logs

### Structured Logging (AWS Lambda Powertools)

Logging uses [`@aws-lambda-powertools/logger`](https://docs.powertools.aws.dev/lambda/typescript/latest/core/logger/). A `Logger` instance is created per handler with a `serviceName` for correlation.

```typescript
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger({ serviceName: "myService" });

logger.info("user created", { userId: result.id });
logger.warn("something unexpected", { detail });
logger.error("operation failed", { error });
```

Log output is structured JSON, automatically enriched with Lambda context (request ID, cold start, etc.) when running on AWS.

**Viewing logs:**

```bash
# Tail logs for a deployed handler
pnpm logs user-create --tail

# Filter for errors only
aws logs tail /aws/lambda/aws-serverless-infrastructure-dev-user-create \
  --follow \
  --filter-pattern "ERROR"
```

### Distributed Tracing (AWS X-Ray)

X-Ray tracing is enabled at both the API Gateway and Lambda levels via `serverless.ts`. Each handler invocation is automatically wrapped in an X-Ray subsegment by the `tracerMiddleware` in [src/middleware/api.ts](src/middleware/api.ts).

The tracer uses [`@aws-lambda-powertools/tracer`](https://docs.powertools.aws.dev/lambda/typescript/latest/core/tracer/).

**What is traced automatically:**

- Every Lambda invocation (segment created by the X-Ray daemon)
- Each handler execution (subsegment via `tracerMiddleware`)
- Errors are recorded on the subsegment automatically

**Viewing traces:**

```bash
# Open AWS Console → X-Ray → Traces
# Filter by service name: aws-serverless-infrastructure
```

Or via CLI:

```bash
aws xray get-trace-summaries \
  --time-range-type TraceId \
  --start-time $(date -u -v-1H +%s) \
  --end-time $(date -u +%s) \
  --region us-east-1
```

> X-Ray tracing is only active on deployed AWS environments. It is a no-op locally (`serverless-offline` does not emulate X-Ray).

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
  .openapi("BaseUser");

// Response Model (Inherits fields and displays as a reference)
const UserResponse = BaseUser.extend({
  id: z.string().uuid(),
}).openapi("UserResponse");
```

## 📈 Roadmap & TODOs

- [x] Onion/Clean Architecture
- [x] Zod runtime validation (request + response)
- [x] Centralized error handling middleware
- [x] Standardized error response schemas
- [x] Local DynamoDB via Docker
- [x] OpenAPI documentation auto-generated from Zod schemas
- [x] Auto-register OpenAPI routes in restApiHander
- [x] Multi-server OpenAPI spec with env-base URLS
- [x] OpenAPI deploy to S3 static html
- [x] Logging — Structured logging with AWS Lambda Powertools
- [x] Observability — AWS X-Ray distributed tracing
- [x] Portrait upload — Dedicated presigned URL endpoint (`GET /users/{id}/portrait/upload-url`)
- [x] Email verification — SNS-based 6-digit code flow
- [x] AI enrichment — Bedrock (Claude 3 Haiku) generates bio/tags on user creation
- [ ] Security — Hander the authorization header
- [ ] Third/Internal service intercation via Axios
- [ ] SQS — Async decoupling for background tasks
- [ ] Lambda Power Tuning — Memory/cost benchmarking
