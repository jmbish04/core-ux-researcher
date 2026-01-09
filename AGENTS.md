## Project Overview

Full-stack React application template optimized for Cloudflare Workers deployment.

## Monorepo Structure

- `apps/web/` - Marketing static website
- `apps/app/` - Main application SPA
- `apps/api/` - tRPC API server
- `apps/email/` - React Email templates for authentication emails
- `packages/core/` - Shared core utilities and WebSocket functionality
- `packages/ui/` - Shared UI components and shadcn/ui management scripts
- `db/` - Drizzle ORM schemas and migrations
- `infra/` - Terraform infrastructure configuration
- `docs/` - VitePress documentation site
- `scripts/` - Build and utility scripts

## Tech Stack

- **Runtime:** Node.js (>=20.0.0), PNPM (>=10), TypeScript 5.8
- **Frontend:** React 19, TanStack Router, Jotai, shadcn/ui, Tailwind CSS v4, Better Auth
- **Backend:** Hono framework, tRPC
- **Database:** Neon PostgreSQL, Drizzle ORM
- **Testing:** Vitest, Happy DOM
- **Deployment:** Cloudflare Workers, Wrangler

## Essential Commands

```bash
# Development
pnpm dev                        # Start web app dev server
pnpm web:dev                    # Start web app (shortcut)
pnpm api:dev                    # Start API server (shortcut)
pnpm app:dev                    # Start main app (shortcut)

# Building
pnpm build                      # Build all apps
pnpm web:build                  # Build web app (shortcut)
pnpm app:build                  # Build main app (shortcut)
pnpm --filter @repo/api build   # Build API types

# Testing
pnpm test                       # Run all tests
pnpm web:test                   # Test web app (shortcut)
pnpm app:test                   # Test main app (shortcut)
pnpm api:test                   # Test API (shortcut)

# UI Components
pnpm ui:add <component>         # Add shadcn/ui component
pnpm ui:list                    # List installed components
pnpm ui:update                  # Update all components
pnpm ui:essentials              # Install essential components

# Email Templates
pnpm email:dev                  # Start email preview server
pnpm email:build                # Build email templates
pnpm email:export               # Export static email templates

# Other
pnpm lint                       # Lint all code
pnpm --filter @repo/db push     # Apply DB schema changes

# Database
pnpm --filter @repo/db generate # Generate migrations
pnpm --filter @repo/db studio   # Open DB GUI
pnpm --filter @repo/db seed     # Seed sample data

# Deployment
# Build required packages first
pnpm email:build                # Build email templates
pnpm web:build                  # Build marketing site
pnpm app:build                  # Build main React app

# Deploy all applications
pnpm web:deploy                 # Deploy marketing site
pnpm api:deploy                 # Deploy API server
pnpm app:deploy                 # Deploy main React app
```

## Code Conventions

1. **Functional Programming:** Favor functional patterns (e.g., hooks, pure functions) over class-based code for better composability and testability.
2. **Modern TypeScript:** Leverage latest features (e.g., const assertions, template literals); avoid legacy patterns like `_` prefixes for private variables.
3. **Imports:** Use named imports (e.g., `import { foo } from "bar";`) for tree-shaking, readability, and modern standards; avoid namespace imports (e.g., `import * as baz from "bar";`).
4. **Hono Idioms:** Incorporate Hono middleware patterns for performance and simplicity.
5. **Comments:** Use brief `//` rationale comments for non-obvious logic; reserve `@file` JSDoc blocks for core architectural files only.
