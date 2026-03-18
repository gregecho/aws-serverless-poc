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
npx serverless offline

# Invoke a function locally
npx serverless invoke local -f create-user --data '{"name": "John", "email": "john@example.com"}'

# Run all tests with coverage
npm run test:coverage
```

### 4. Deployment

```bash
npx serverless deploy
```

### 🧪 Testing Strategy

We employ a dual-layered testing strategy to ensure reliability:

- Unit Tests: Focus on the Service Layer. Dependencies like DynamoDB are isolated using vi.mock to test business logic in a pure environment.

- Integration Tests: Test the Lambda Handler end-to-end, including the behavior of the Middy middleware stack (validation, parsing, and error interception).

- Mocking: Utilizes Faker.js for realistic data generation and vi.spyOn for dependency tracking.

## 📈 Roadmap & TODOs

- [ ] Observability: Integrate AWS X-Ray for distributed tracing and CloudWatch Metrics.

- [ ] CI/CD: Implementation of GitHub Actions for automated Linting, Testing, and Deployment.

- [ ] API Documentation: Automatic Swagger/OpenAPI generation from Zod schemas.

- [ ] Security: Implementation of AWS Secrets Manager for environment variable protection.
