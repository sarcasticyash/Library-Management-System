# Frontend Application Directory

## Overview

This directory contains the source code, tests, and configuration for the Modern React Frontend of the Library Management System.

## Architecture

- **Framework**: React 18+ with TypeScript
- **Bundler**: Vite
- **Routing**: React Router v6
- **Server State & Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios with interceptors for JWT access token injection and automatic refresh token rotation
- **Styling**: Component-scoped CSS modules and a custom Vanilla CSS design system (tokens, glassmorphism, responsive grid)
- **Testing**: Vitest, React Testing Library, Playwright (E2E)

## Structure (Planned for Application Phase)

```text
apps/frontend/
├── public/              # Static assets, icons, manifest
├── src/
│   ├── assets/          # Images, SVGs, stylesheets
│   ├── components/      # Reusable atomic UI components (Button, Modal, Table, Input)
│   ├── context/         # React Contexts (AuthContext, ThemeContext)
│   ├── hooks/           # Custom React hooks (useAuth, useBooks, useDebounce)
│   ├── layouts/         # Layout shells (AppLayout, AuthLayout, AdminLayout)
│   ├── pages/           # Page view components (Catalog, Dashboard, History, Login)
│   ├── services/        # API client and endpoints (apiClient, authService, bookService)
│   ├── styles/          # Global styles, CSS variables, design tokens
│   ├── types/           # TypeScript interface & type definitions
│   ├── utils/           # Helper functions, formatters, validators
│   ├── App.tsx          # Main application router and providers
│   └── main.tsx         # Application entry point
├── Dockerfile           # Multi-stage production build (Node build -> Nginx alpine serve)
├── nginx.conf           # Production Nginx reverse proxy / SPA fallback config
├── package.json         # Frontend dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite build configuration
```
