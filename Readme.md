# AWS Serverless Modernization POC (TypeScript)

> **A production-ready Serverless architecture utilizing TypeScript, Middy, and DynamoDB, following Onion/Clean Architecture principles.**

---

## 📖 Project Overview

This project is a high-quality **Proof of Concept (POC)** built with the **Serverless Framework**. It demonstrates how to build maintainable, scalable, and testable cloud-native applications on AWS.

Beyond a simple Lambda function, this repository showcases a robust enterprise-grade structure focusing on **separation of concerns**, **runtime validation**, and **automated testing**.

### Key Features

- **Onion Architecture**: Strict separation between Handlers, Services, and Repositories.
- **Type Safety**: End-to-end TypeScript implementation with **Zod** for runtime schema validation.
- **Robust Middleware**: Powered by **Middy** for centralized JSON parsing, input validation, and standardized error handling.
- **Comprehensive Testing**: Full test suite using **Vitest** with local DynamoDB mocking.

---

## 🏗️ Architecture Design

The project follows the **Onion/Clean Architecture** pattern to ensure the business logic remains independent of external infrastructure (AWS SDK, Database).

### Data Flow

`API Gateway` ➔ `Middy Middleware` ➔ `Lambda Handler` ➔ `Service Layer` ➔ `Repository Layer` ➔ `DynamoDB`

- **Handler Layer**: Pure entry point. Adapts API Gateway events and manages middleware.
- **Service Layer**: The "Brain." Contains core business logic and rules.
- **Repository Layer**: Data access abstraction. Interacts with the DynamoDB client.
- **Middleware Stack**: Handles cross-cutting concerns (Validation, HTTP Error Formatting).

---

## 🛠️ Tech Stack

| Category       | Technology                           |
| :------------- | :----------------------------------- |
| **Language**   | TypeScript                           |
| **Framework**  | Serverless Framework                 |
| **Middleware** | Middy (@middy/core)                  |
| **Validation** | Zod                                  |
| **Database**   | AWS DynamoDB (@aws-sdk/lib-dynamodb) |
| **Testing**    | Vitest, Faker.js                     |

---

## 📂 Project Structure

```text
src/
├─ clients/      # AWS Client initializations (DynamoDB, etc.)
├─ docs/     # Lambda entry points (Event parsing & response)
│ └─ openapi.ts # The central hub that aggregates all routes.
│ └─ gen-docs.ts # CLI execution script responsible for file I/O.
│ └─ registry.ts # The global singleton instance of the OpenAPI Registry.
│ └─ user.docs.ts # API path definitions organized by business modules.
├─ handlers/     # Lambda entry points (Event parsing & response)
│ └─ user/
│ └─ create-user-handler.ts
├─ services/     # Business logic layer (Framework-agnostic)
├─ repositories/ # Data access layer (Persistence logic)
├─ schemas/      # Zod validation schemas
├─ utils/        # Helpers and custom middleware
└─ tests/        # Unit & Integration test suites
```

## 🚀 Quick Start

### 1. Installation

```bash
npm install
# or
pnpm install
```

### 2. Environment Configuration

Create a .env file in the root directory:

```typescript
USERS_TABLE = your - dynamodb - table;
AWS_REGION = your - region;
```

### 3. Local Development & Testing

```bash
# Start local simulation
pnpm serverless offline

# Invoke a function locally
pnpm serverless invoke local -f create-user --data '{ "body": "{\"name\": \"John\", \"email\": \"john@example.com\"}", "headers": { "Content-Type": "application/json" }, "isBase64Encoded": false }'


# Run all tests with coverage
pnpm run test:coverage
```

### 4. Deployment

```bash
pnpm serverless deploy
```

### 5. OpenApi

```bash
# Generate Spec to openapi.yaml
pnpm docs:gen
# Live Preview: Start a local server in port:4000
pnpm docs:preview
# Generates a standalone `index.html` for deployment
pnpm docs:build
```

### 🧪 Testing Strategy

We employ a dual-layered testing strategy to ensure reliability:

- Unit Tests: Focus on the Service Layer. Dependencies like DynamoDB are isolated using vi.mock to test business logic in a pure environment.

- Integration Tests: Test the Lambda Handler end-to-end, including the behavior of the Middy middleware stack (validation, parsing, and error interception).

- Mocking: Utilizes Faker.js for realistic data generation and vi.spyOn for dependency tracking.

## 📁 API Documentation (OpenAPI)

This project implements a **Schema-First (Zod)** development workflow. API definitions, request validations, and documentation are synchronized using [Zod](https://zod.dev/) and [@asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi).

This ensures **100% consistency** between the TypeScript source code and the generated OpenAPI specification.

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

- [ ] Observability: Integrate AWS X-Ray for distributed tracing and CloudWatch Metrics.

- [ ] CI/CD: Implementation of GitHub Actions for automated Linting, Testing, and Deployment.

- [x] API Documentation: Automatic Swagger/OpenAPI generation from Zod schemas.

- [ ] Security: Implementation of AWS Secrets Manager for environment variable protection.
- [ ] 集成 AWS X-Ray: 引入分布式链路追踪，提升 Serverless 环境下的可观测性。
- [ ] 异步解耦: 在核心链路中引入 Amazon SQS，实现异步任务的削峰填谷。
- [ ] Local Simulation: 引入 LocalStack，实现无需联网即可在 Docker 中模拟全套 AWS 环境进行测试。
- [ ] Performance Benchmarking: 编写一个脚本，对比不同内存配置（128MB vs 1024MB）下 Lambda 的执行效率与成本差异。
- [ ] 精细化异常处理：实现一个全局的 Lambda Error Handler，并对接 CloudWatch Alarms。
- [ ] 全局异常定义
- [ ] Just
