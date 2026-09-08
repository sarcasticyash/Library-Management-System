# Backend API Application Directory

## Overview

This directory contains the source code, tests, and configuration for the Node.js and Express RESTful API backend of the Library Management System.

## Architecture

- **Runtime**: Node.js v20 LTS
- **Language**: TypeScript (strict mode enabled)
- **Framework**: Express.js
- **Database Driver / ODM**: Mongoose with MongoDB Atlas
- **Authentication**: JWT (Access Token in Authorization header, Refresh Token in httpOnly cookie)
- **Validation**: Zod schema validation for request params, query, and body
- **Logging**: Winston / Morgan with structured JSON output and correlation ID tracking
- **Security**: Helmet, CORS, express-rate-limit, mongo-sanitize, HPP
- **Testing**: Jest, Supertest, MongoMemoryServer

## Structure (Planned for Application Phase)

```text
apps/backend/
├── src/
│   ├── config/          # Environment configuration, database connection, logger config
│   ├── constants/       # App constants, HTTP status codes, error messages, user roles
│   ├── controllers/     # Request handlers (auth, books, borrowings, users, admin)
│   ├── errors/          # Custom error classes (AppError, NotFoundError, UnauthorizedError)
│   ├── middlewares/     # Auth guard, RBAC, error handler, rate limiter, request logger
│   ├── models/          # Mongoose schemas & models (User, Book, BorrowingTransaction, AuditLog)
│   ├── repositories/    # Data access layer abstracting DB queries & ACID transactions
│   ├── routes/          # Express route definitions grouped by domain
│   ├── services/        # Core business logic layer (loan logic, inventory check, fine calculation)
│   ├── types/           # TypeScript interfaces, custom Express Request extensions
│   ├── utils/           # Token generation, hashing, date calculations, pagination
│   ├── app.ts           # Express app setup, middleware registration, route mounting
│   └── server.ts        # HTTP server initialization and graceful shutdown handlers
├── Dockerfile           # Multi-stage production container (build -> pruned non-root runtime)
├── package.json         # Backend dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── jest.config.ts       # Unit and integration test runner config
```
