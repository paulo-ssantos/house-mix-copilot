# AGENTS.md

> **AI Agent Documentation for House Mix Copilot Project**
>
> This file provides comprehensive context, guidelines, and best practices for AI coding agents working on the House Mix Copilot project. It complements the README.md by focusing on agent-specific instructions.

---

## 📑 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Quick Start & Setup Commands](#quick-start--setup-commands)
4. [Architecture Overview](#architecture-overview)
5. [Development Workflow](#development-workflow)
6. [Code Organization](#code-organization)
7. [TypeScript Configuration](#typescript-configuration)
8. [ESLint Rules & Enforcement](#eslint-rules--enforcement)
9. [Testing Strategy](#testing-strategy)
10. [Common Patterns & Utilities](#common-patterns--utilities)
11. [NestJS Module Structure](#nestjs-module-structure)
12. [Electron Desktop & IPC Communication](#electron-desktop--ipc-communication)
13. [External Integrations](#external-integrations)
14. [MCP Tools Utilization](#mcp-tools-utilization)
15. [How to Proceed (AI Agent Workflow)](#how-to-proceed-ai-agent-workflow)
16. [Troubleshooting & Common Errors](#troubleshooting--common-errors)

---

## Project Overview

### Current Status

This is a **fresh Nx monorepo scaffold** in the **early stages of migration** from a previous non-Nx implementation (documented in `docs/previous-project/`). The project is being rebuilt using modern monorepo practices with Nx tooling.

### Purpose

**House Mix Copilot** is a sophisticated desktop application for churches to manage worship services, combining:

- 🤖 AI-powered liturgy analysis (using local Ollama)
- 🎵 YouTube video integration
- ⏱️ Real-time worship control (live timer and navigation)
- 📡 Multi-mode operation (Main, Stream, Unified)
- 💾 Local-first architecture
- 🖥️ Cross-platform desktop (Electron)

### Key Features

- **AI Analysis**: Local Ollama integration for liturgy text analysis
- **YouTube Integration**: Video download and metadata extraction
- **Multi-Window Architecture**: Separate processes for main, stream, and unified modes
- **IPC Communication**: Electron IPC for front-back communication (not gRPC)
- **Portuguese-First**: Optimized for Brazilian church traditions
- **Local Database**: Future integration with Prisma or Drizzle ORM

### Migration Context

The previous project used:

- Nuxt 3 monorepo with Yarn Workspaces
- SQLite + Drizzle ORM
- Ollama + Jina AI services
- yt-dlp for YouTube downloads
- Custom logging and settings management

**Current State**: Basic scaffolding complete. Core features need migration.

---

## Technology Stack

### Core Technologies

| Technology     | Version | Purpose                                 |
| -------------- | ------- | --------------------------------------- |
| **Nx**         | 22.0.1  | Monorepo management, task orchestration |
| **Node.js**    | 20.19.9 | Runtime environment                     |
| **TypeScript** | 5.9.2   | Type-safe JavaScript (strict mode)      |
| **Yarn**       | Latest  | Package manager (workspaces enabled)    |

### Backend Stack

| Technology           | Version | Purpose                     |
| -------------------- | ------- | --------------------------- |
| **NestJS**           | 11.0.0  | Backend framework (Node.js) |
| **RxJS**             | 7.8.0   | Reactive programming        |
| **Webpack**          | Latest  | Backend bundler             |
| **Reflect Metadata** | 0.1.13  | Decorator metadata          |

### Frontend Stack

| Technology     | Version | Purpose                    |
| -------------- | ------- | -------------------------- |
| **Nuxt 3**     | 3.10.0  | Vue.js framework (SSR/SPA) |
| **Vue 3**      | 3.5.13  | UI framework               |
| **Vue Router** | 4.5.0   | Client-side routing        |
| **H3**         | 1.8.2   | HTTP server for Nuxt       |

### Desktop Stack

| Technology      | Version | Purpose                       |
| --------------- | ------- | ----------------------------- |
| **Electron**    | 34.5.6  | Desktop application wrapper   |
| **nx-electron** | 21.0.1  | Nx plugin for Electron builds |

### Testing Stack

| Technology          | Version | Purpose                         |
| ------------------- | ------- | ------------------------------- |
| **Jest**            | 30.0.2  | Backend + E2E testing           |
| **Vitest**          | 3.0.0   | Frontend testing (Vite-powered) |
| **@vue/test-utils** | 2.4.6   | Vue component testing           |

### Code Quality

| Technology            | Version | Purpose                     |
| --------------------- | ------- | --------------------------- |
| **ESLint**            | 9.8.0   | Linting (flat config)       |
| **Prettier**          | 2.6.2   | Code formatting             |
| **TypeScript ESLint** | 8.40.0  | TypeScript-specific linting |

### Nx Plugins

- `@nx/js` - JavaScript/TypeScript support
- `@nx/nest` - NestJS application support
- `@nx/nuxt` - Nuxt 3 application support
- `@nx/webpack` - Webpack integration
- `@nx/vite` - Vite integration
- `@nx/eslint` - ESLint integration
- `@nx/jest` - Jest testing integration

---

## Quick Start & Setup Commands

### Installation

```bash
# Install dependencies (run once after clone)
yarn install

# Post-install automatically runs:
# - electron-builder install-app-deps (twice for monorepo setup)
```

### Development Commands

#### Frontend (Nuxt 3)

```bash
# Serve frontend in development mode
yarn nxe:serve:frontend
# Equivalent to: nx serve @house-mix-copilot/frontend-main
# Runs on: http://localhost:4200 (default Nx dev server port)

# Build frontend for production
yarn nxe:build:frontend
# Equivalent to: nx build @house-mix-copilot/frontend-main
# Output: dist/apps/frontend-main

# Test frontend (Vitest)
yarn nxe:test:frontend
# Equivalent to: nx test @house-mix-copilot/frontend-main
```

#### Backend (NestJS)

```bash
# Serve backend in development mode
yarn nxe:serve:backend
# Equivalent to: nx serve desktop-main
# Runs on: http://localhost:3000/api

# Build backend for production
yarn nxe:build:backend
# Equivalent to: nx build desktop-main
# Output: dist/apps/backend-main

# Test backend (Jest)
yarn nxe:test:backend
# Equivalent to: nx test desktop-main
```

#### Electron Desktop

```bash
# Package Electron app (pre-package only)
yarn nxe:package:app
# Equivalent to: nx run desktop-main:make --prepackageOnly
# Creates distributable without installers

# Make Electron app (full build with installers)
yarn nxe:make:app
# Equivalent to: nx run desktop-main:make
# Creates installers for target platforms
```

### Nx-Specific Commands

#### Running Tasks

```bash
# Run specific task for a project
nx run <project>:<target>
nx run @house-mix-copilot/backend-main:build

# Run task for multiple projects
nx run-many --target=build --projects=backend-main,frontend-main

# Run task for affected projects (based on git changes)
nx affected --target=test
nx affected --target=build --base=main --head=HEAD
```

#### Linting & Type Checking

```bash
# Lint specific project
nx lint @house-mix-copilot/backend-main

# Type check specific project
nx typecheck @house-mix-copilot/backend-main

# Lint all projects
nx run-many --target=lint --all

# ⚠️ CRITICAL: Always run lint before committing
nx affected --target=lint
```

#### Testing

```bash
# Test specific project
nx test <project-name>

# Test with coverage
nx test <project-name> --coverage

# Test all projects
nx run-many --target=test --all

# Test affected projects
nx affected --target=test

# E2E tests
nx e2e @house-mix-copilot/backend-main-e2e
```

#### Workspace Commands

```bash
# View project graph (visual dependency graph)
nx graph

# Show workspace info
nx report

# Clear Nx cache
nx reset
```

### Nx MCP Server Commands

**Use these tools when working with AI agents:**

```bash
# Get workspace overview
nx_workspace

# Get detailed project info
nx_project_details --projectName="@house-mix-copilot/backend-main"

# Search Nx documentation
nx_docs --query="testing best practices"

# Visualize project graph
nx_visualize_graph --visualizationType="full-project-graph"
```

---

## Architecture Overview

### Workspace Structure

```
house-mix-copilot/
├── apps/
│   ├── backend-main/          # NestJS backend (Webpack build)
│   ├── backend-main-e2e/      # E2E tests for backend
│   ├── frontend-main/         # Nuxt 3 frontend (Vite build)
│   └── desktop-main/          # Electron desktop app
├── packages/                  # Future shared libraries
├── docs/                      # Documentation
│   └── previous-project/      # Legacy project reference
├── nx.json                    # Nx workspace configuration
├── package.json               # Root package.json (workspaces)
├── tsconfig.base.json         # Base TypeScript config
├── eslint.config.mjs          # Root ESLint config
├── jest.config.ts             # Root Jest config
└── vitest.workspace.ts        # Vitest workspace config
```

### Application Details

#### 1. @house-mix-copilot/backend-main

- **Type**: Application
- **Framework**: NestJS 11.0.0
- **Build Tool**: Webpack
- **Entry Point**: `apps/backend-main/src/main.ts`
- **API Prefix**: `/api`
- **Port**: 3000 (or `process.env.PORT`)
- **Targets**:
  - `build` - Production build with Webpack
  - `serve` - Development server
  - `test` - Jest unit tests
  - `lint` - ESLint checks
  - `typecheck` - TypeScript validation

**Dependencies**:

- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`
- `rxjs`, `reflect-metadata`

#### 2. @house-mix-copilot/frontend-main

- **Type**: Application
- **Framework**: Nuxt 3.10.0
- **Build Tool**: Vite
- **Entry Point**: `apps/frontend-main/src/app.vue`
- **Port**: 4200 (default Nx dev server)
- **Targets**:
  - `build` - Production build
  - `serve` - Development server
  - `test` - Vitest unit tests
  - `lint` - ESLint checks
  - `typecheck` - Vue + TypeScript validation

**Dependencies**:

- `vue`, `vue-router`, `nuxt`

#### 3. desktop-main

- **Type**: Application
- **Framework**: Electron 34.5.6
- **Entry Point**: `apps/desktop-main/src/main.ts`
- **Targets**:
  - `build` - Build Electron main process
  - `serve` - Run Electron in dev mode
  - `package` - Create distributable (pre-package)
  - `make` - Create installers
  - `test` - Jest tests

**Key Features**:

- Squirrel events handling (Windows auto-update)
- Auto-updater service (disabled in dev)
- Development mode detection
- IPC communication with renderer process

### Dependency Graph

```
desktop-main (Electron)
  └─> frontend-main (Renderer Process - Nuxt 3)
  └─> backend-main (IPC Communication - NestJS)
      └─> backend-main-e2e (E2E Tests)
```

**Note**: Apps communicate via Electron IPC (Inter-Process Communication), not HTTP or gRPC.

### Nx Configuration Highlights

#### Plugins

- `@nx/js/typescript` - TypeScript builds and type checking
- `@nx/nuxt/plugin` - Nuxt application support
- `@nx/eslint/plugin` - ESLint integration
- `@nx/vite/plugin` - Vite builds and testing
- `@nx/webpack/plugin` - Webpack builds

#### Named Inputs

- **default**: All project files + shared globals
- **production**: Excludes test files, configs, and dev artifacts
- **sharedGlobals**: Workspace-level shared files

#### Target Defaults

- **test**: Depends on `^build` (build dependencies first)
- **@nx/jest:jest**:
  - Caching enabled
  - Pass with no tests
  - CI configuration with coverage

#### Nx Cloud

- **Cloud ID**: `68fbbca850ea59533473118a`
- Enables distributed task execution and remote caching

---

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

# CI Error Guidelines

If the user wants help with fixing an error in their CI pipeline, use the following flow:

- Retrieve the list of current CI Pipeline Executions (CIPEs) using the `nx_cloud_cipe_details` tool
- If there are any errors, use the `nx_cloud_fix_cipe_failure` tool to retrieve the logs for a specific task
- Use the task logs to see what's wrong and help the user fix their problem. Use the appropriate tools if necessary
- Make sure that the problem is fixed by running the task that you passed into the `nx_cloud_fix_cipe_failure` tool

<!-- nx configuration end-->

---

## Development Workflow

### How to Proceed (AI Agent Systematic Approach)

**CRITICAL**: Follow this 6-phase systematic approach for all tasks. This ensures quality, prevents errors, and aligns with project standards.

#### Phase 1: Research & Context Gathering 🔍

1. **Check ALL sources** from the research topic
2. **Use MCP Tools**:
   - `nx_workspace` - Get workspace overview
   - `nx_project_details` - Analyze specific project
   - `nx_docs` - Search Nx documentation when unsure
   - `fetch_webpage` - Research external libraries/APIs
   - `mcp_upstash_conte_resolve-library-id` + `mcp_upstash_conte_get-library-docs` - Get up-to-date library docs
3. **Read codebase files** related to the task
4. **Check existing patterns** in similar implementations

#### Phase 2: Quantum Thinking Process 🧠

1. **Use Sequential Thinking MCP tool** for complex problems
2. **Perform deep analysis**:
   - What is the user really asking for?
   - What are the implicit requirements?
   - What are the constraints (TypeScript strict mode, ESLint rules)?
   - What patterns should I follow (NestJS modules, Vue composables)?
3. **Consider alternatives** and edge cases
4. **Identify dependencies** and affected modules

#### Phase 3: Planning & Approval 📋

1. **Create detailed plan** with specific steps
2. **Use `mcp_user-prompt-m_user_prompt`** to present plan to user
3. **Wait for approval or refinement** - DO NOT proceed without confirmation
4. **Adjust plan** based on user feedback

#### Phase 4: Execution with Checkpoints ⚙️

1. **Execute plan step-by-step**
2. **Make incremental changes** (small, testable commits)
3. **Test each change** immediately:
   - Run relevant tests (`nx test <project>`)
   - Check build (`nx build <project>`)
   - Verify functionality
4. **Ask for guidance** if anything is unclear (use `mcp_user-prompt-m_user_prompt`)
5. **Document changes** as you go

#### Phase 5: Validation & Testing ✅

1. **Run all affected tests**:
   ```bash
   nx affected --target=test
   ```
2. **Check coverage** (minimum 70%):
   ```bash
   nx test <project> --coverage
   ```
3. **Verify builds**:
   ```bash
   nx affected --target=build
   ```
4. **Test E2E** if applicable:
   ```bash
   nx e2e @house-mix-copilot/backend-main-e2e
   ```

#### Phase 6: Linting & Finalization 🎯

1. **ALWAYS run lint** before completing:
   ```bash
   nx affected --target=lint
   ```
2. **Fix all ESLint errors** - Do not ignore or suppress
3. **Type check**:
   ```bash
   nx affected --target=typecheck
   ```
4. **Verify all commands from package.json** work correctly
5. **Final review** of all changes

### Critical Reminders

⚠️ **DO NOT**:

- Skip linting (causes repeated refactoring)
- Ignore package.json commands (use `yarn nxe:*` commands)
- Suppress ESLint errors without understanding them
- Make changes without testing
- Proceed without user approval on the plan

✅ **ALWAYS**:

- Use MCP tools for research and guidance
- Follow TypeScript strict mode rules
- Run lint before committing
- Test incrementally
- Ask for clarification when unsure

---

## Code Organization

### Backend (apps/backend-main)

```
apps/backend-main/
├── src/
│   ├── main.ts                 # Bootstrap file (NestJS app)
│   ├── app/
│   │   ├── app.module.ts       # Root module
│   │   ├── app.controller.ts   # Root controller
│   │   └── app.service.ts      # Root service
│   └── assets/                 # Static assets
├── jest.config.ts              # Jest configuration
├── tsconfig.json               # TypeScript config (extends base)
├── tsconfig.app.json           # App-specific TS config
├── tsconfig.spec.json          # Test-specific TS config
├── webpack.config.js           # Webpack configuration
└── eslint.config.mjs           # ESLint config (extends root)
```

**NestJS Module Pattern**:

- Each feature should have its own module folder
- Follow: `<feature>/<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts`
- Use dependency injection for services
- Export only what's needed by other modules

### Frontend (apps/frontend-main)

```
apps/frontend-main/
├── src/
│   ├── app.vue                 # Root Vue component
│   ├── assets/
│   │   └── css/                # Global styles
│   ├── components/             # Vue components
│   │   └── NxWelcome.vue
│   ├── pages/                  # Nuxt pages (auto-routing)
│   │   ├── index.vue
│   │   └── about.vue
│   ├── public/                 # Static files
│   └── server/                 # Nuxt server routes
│       ├── tsconfig.json
│       └── api/                # API routes
├── nuxt.config.ts              # Nuxt configuration
├── vitest.config.ts            # Vitest configuration
├── tsconfig.json               # TypeScript config
└── eslint.config.mjs           # ESLint config
```

**Nuxt 3 Patterns**:

- Use `pages/` for auto-routing
- Place reusable components in `components/`
- API routes in `server/api/`
- Composables in `composables/` (Vue 3 Composition API)

### Desktop (apps/desktop-main)

```
apps/desktop-main/
├── src/
│   ├── main.ts                 # Electron main process entry
│   ├── app/
│   │   ├── app.ts              # Main app class
│   │   ├── constants.ts        # Constants
│   │   ├── api/                # IPC API handlers
│   │   ├── events/             # Event handlers
│   │   │   ├── electron.events.ts
│   │   │   ├── squirrel.events.ts
│   │   │   └── update.events.ts
│   │   └── options/            # Electron options
│   ├── assets/                 # Desktop assets
│   └── environments/           # Environment configs
│       ├── environment.ts
│       └── environment.prod.ts
├── project.json                # Nx project config
├── jest.config.ts              # Jest configuration
└── tsconfig.json               # TypeScript config
```

**Electron Patterns**:

- Main process: `main.ts` bootstraps the app
- IPC handlers in `app/api/`
- Event management in `app/events/`
- Development mode detection: `App.isDevelopmentMode()`

### File Naming Conventions

- **TypeScript files**: `kebab-case.ts`
- **Components (Vue)**: `PascalCase.vue`
- **Tests**: `*.spec.ts` or `*.test.ts`
- **Configs**: `*.config.ts` or `*.config.mjs`
- **Modules (NestJS)**: `<name>.module.ts`
- **Controllers (NestJS)**: `<name>.controller.ts`
- **Services (NestJS)**: `<name>.service.ts`

---

## TypeScript Configuration

### Base Configuration (tsconfig.base.json)

**Strict Mode Enabled** - All projects inherit these rules:

```jsonc
{
  "compilerOptions": {
    "strict": true, // Enable all strict type checks
    "noUnusedLocals": true, // Error on unused local variables
    "noImplicitReturns": true, // Error on missing return statements
    "noFallthroughCasesInSwitch": true, // Error on fallthrough cases
    "noImplicitOverride": true, // Error on missing 'override' keyword
    "noEmitOnError": true, // Don't emit JS if errors exist

    // Module system
    "module": "nodenext", // Node.js ESM modules
    "moduleResolution": "nodenext", // Node.js module resolution

    // Target and libraries
    "target": "es2022", // Modern JavaScript
    "lib": ["es2022"], // ES2022 standard library

    // Other important options
    "isolatedModules": true, // Each file can be transpiled independently
    "skipLibCheck": true, // Skip type checking of .d.ts files
    "importHelpers": true, // Use tslib for helpers
    "composite": true, // Enable project references
    "declarationMap": true, // Source maps for .d.ts files
    "emitDeclarationOnly": true // Only emit declarations (build handled by Webpack/Vite)
  }
}
```

### Per-Project TypeScript Configs

Each app has its own `tsconfig.json` that extends the base:

**Backend (apps/backend-main/tsconfig.json)**:

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "esModuleInterop": true,
    "emitDecoratorMetadata": true, // For NestJS decorators
    "experimentalDecorators": true // Enable decorators
  },
  "files": [],
  "include": [],
  "references": [
    {
      "path": "./tsconfig.app.json"
    },
    {
      "path": "./tsconfig.spec.json"
    }
  ]
}
```

**Frontend (apps/frontend-main/tsconfig.json)**:

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve", // Preserve JSX for Vue
    "resolveJsonModule": true
  }
}
```

### Key TypeScript Rules for AI Agents

#### 1. No Unused Locals

```typescript
// ❌ ERROR: Unused variable
const unusedVar = 'hello';

// ✅ CORRECT: Remove unused variables
// (or prefix with _ if intentionally unused for future use)
const _futureUse = 'hello';
```

#### 2. No Implicit Returns

```typescript
// ❌ ERROR: Not all code paths return a value
function getValue(condition: boolean): string {
  if (condition) {
    return 'yes';
  }
  // Missing return for false case
}

// ✅ CORRECT: All paths return
function getValue(condition: boolean): string {
  if (condition) {
    return 'yes';
  }
  return 'no';
}
```

#### 3. No Fallthrough Cases

```typescript
// ❌ ERROR: Fallthrough case in switch
switch (value) {
  case 'a':
    doSomething();
  case 'b': // Error: fallthrough
    doOtherThing();
    break;
}

// ✅ CORRECT: Explicit break or return
switch (value) {
  case 'a':
    doSomething();
    break;
  case 'b':
    doOtherThing();
    break;
}
```

#### 4. Strict Null Checks

```typescript
// ❌ ERROR: Possibly undefined
const user: User | undefined = getUser();
console.log(user.name); // Error: user might be undefined

// ✅ CORRECT: Handle null/undefined
const user: User | undefined = getUser();
if (user) {
  console.log(user.name);
}
// Or use optional chaining
console.log(user?.name);
```

#### 5. Explicit Types (Recommended)

```typescript
// ❌ AVOID: Implicit any
function process(data) {
  // data: any (implicit)
  return data.value;
}

// ✅ CORRECT: Explicit types
function process(data: { value: string }): string {
  return data.value;
}
```

### Path Aliases

Currently, no custom path aliases are configured. Use relative imports:

```typescript
// ✅ CORRECT: Relative imports
import { AppService } from './app.service';
import { User } from '../../types/user.interface';
```

**Future**: When path aliases are added to `tsconfig.base.json`, they will be documented here.

---

## ESLint Rules & Enforcement

### Root ESLint Configuration (eslint.config.mjs)

The project uses **ESLint flat config** (ESLint 9.8.0) with Nx plugin integration:

```javascript
import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.vue'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
];
```

### Key ESLint Rules

#### 1. Nx Module Boundaries

**Rule**: `@nx/enforce-module-boundaries`

- **Purpose**: Enforce architectural constraints between projects
- **Severity**: ERROR
- **Key Points**:
  - Projects must respect dependency boundaries
  - Buildable libraries can only depend on other buildable libraries
  - Tag-based dependency constraints

```typescript
// ❌ ERROR: Importing from wrong boundary
import { SomeService } from '../../../other-app/src/service';

// ✅ CORRECT: Import from allowed boundaries
import { SomeService } from '@house-mix-copilot/shared-services';
```

#### 2. TypeScript ESLint Rules (Inherited from Nx)

- **No unused variables**: Enforced by TypeScript `noUnusedLocals`
- **Explicit return types**: Recommended for public APIs
- **No implicit any**: Use explicit types
- **Prefer const**: Use `const` for non-reassigned variables

#### 3. Code Quality Rules

- **Consistent formatting**: Prettier integration
- **Consistent imports**: Group and order imports logically
- **No console.log in production**: Use proper logging utilities

### Per-App ESLint Configuration

Each app extends the root configuration:

```javascript
// apps/backend-main/eslint.config.mjs
import baseConfig from '../../eslint.config.mjs';

export default [...baseConfig];
```

### Running ESLint

```bash
# Lint specific project
nx lint @house-mix-copilot/backend-main

# Lint with auto-fix
nx lint @house-mix-copilot/backend-main --fix

# Lint all projects
nx run-many --target=lint --all

# Lint only affected projects (RECOMMENDED before commit)
nx affected --target=lint

# Lint in CI mode (no cache)
nx affected --target=lint --configuration=ci
```

### Common ESLint Violations & Fixes

#### Violation 1: Module Boundary Breach

```typescript
// ❌ ERROR: Direct import from another app
import { User } from '../../../backend-main/src/app/user.entity';

// ✅ FIX: Create shared library or use proper API
// Create packages/shared/src/types/user.type.ts
import { User } from '@house-mix-copilot/shared';
```

#### Violation 2: Unused Imports

```typescript
// ❌ ERROR: Unused import
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  // Logger never used
}

// ✅ FIX: Remove unused import
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {}
```

#### Violation 3: Implicit Return Type

```typescript
// ❌ WARNING: Missing return type
async function getData() {
  return await fetchData();
}

// ✅ FIX: Add explicit return type
async function getData(): Promise<Data> {
  return await fetchData();
}
```

### Critical ESLint Workflow

⚠️ **ALWAYS follow this sequence**:

1. Make code changes
2. Run `nx lint <project> --fix` to auto-fix issues
3. Manually fix remaining issues
4. Run `nx lint <project>` to verify
5. Run `nx typecheck <project>` to verify types
6. Commit changes

**DO NOT**:

- Suppress ESLint errors with `// eslint-disable-next-line` unless absolutely necessary
- Ignore ESLint warnings (fix them or document why they're acceptable)
- Commit code without running lint

---

## Testing Strategy

### Testing Overview

The project uses a **dual testing approach**:

- **Jest** for backend (NestJS) and E2E tests
- **Vitest** for frontend (Nuxt 3/Vue)

### Jest Configuration (Backend)

**Root Jest Config** (jest.config.ts):

```typescript
import type { Config } from 'jest';
import { getJestProjectsAsync } from '@nx/jest';

export default async (): Promise<Config> => ({
  projects: await getJestProjectsAsync(),
});
```

**Backend Jest Config** (apps/backend-main/jest.config.ts):

```typescript
export default {
  displayName: '@house-mix-copilot/backend-main',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      '@swc/jest',
      {
        /* config */
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../test-output/jest/coverage/apps/backend-main',
  passWithNoTests: true,
};
```

**Running Jest Tests**:

```bash
# Test backend
nx test @house-mix-copilot/backend-main

# Test with coverage
nx test @house-mix-copilot/backend-main --coverage

# Test in watch mode
nx test @house-mix-copilot/backend-main --watch

# Test specific file
nx test @house-mix-copilot/backend-main --testFile=app.service.spec.ts
```

### Vitest Configuration (Frontend)

**Vitest Workspace** (vitest.workspace.ts):

```typescript
export default [
  '**/vite.config.{mjs,js,ts,mts}',
  '**/vitest.config.{mjs,js,ts,mts}',
];
```

**Frontend Vitest Config** (apps/frontend-main/vitest.config.ts):

```typescript
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
```

**Running Vitest Tests**:

```bash
# Test frontend
nx test @house-mix-copilot/frontend-main

# Test with coverage
nx test @house-mix-copilot/frontend-main --coverage

# Test in watch mode
nx test @house-mix-copilot/frontend-main --watch

# Test with UI
nx test @house-mix-copilot/frontend-main --ui
```

### Testing Patterns

#### NestJS Controller Testing

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  const mockService = {
    getData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);
  });

  it('should return data', () => {
    mockService.getData.mockReturnValue({ message: 'Hello' });
    expect(controller.getData()).toEqual({ message: 'Hello' });
  });
});
```

#### Vue Component Testing

```typescript
import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import NxWelcome from './NxWelcome.vue';

describe('NxWelcome', () => {
  it('renders properly', () => {
    const wrapper = mount(NxWelcome);
    expect(wrapper.text()).toContain('Welcome');
  });
});
```

### E2E Testing

**Backend E2E** (apps/backend-main-e2e):

```bash
# Run E2E tests
nx e2e @house-mix-copilot/backend-main-e2e

# Run E2E with specific configuration
nx e2e @house-mix-copilot/backend-main-e2e --configuration=ci
```

### Coverage Requirements

⚠️ **Minimum Coverage**: 70%

```bash
# Check coverage
nx test <project> --coverage

# CI mode (enforces coverage thresholds)
nx test <project> --configuration=ci
```

### Testing Workflow

1. **Write tests alongside code** (TDD preferred)
2. **Run tests frequently** during development
3. **Ensure tests pass** before committing
4. **Check coverage** for new features
5. **Update tests** when refactoring

---

## Common Patterns & Utilities

### Logger Pattern (From Previous Project)

**Purpose**: Structured, category-based logging for client and server

**Key Features**:

- Browser-safe implementation
- Emoji-based console styling
- Structured log entries with timestamps
- Server logging in production mode

**Example Usage**:

```typescript
import { useLogger } from './composables/useLogger';

const { logger } = useLogger();

// User interactions
logger.userAction('button-click', { button: 'save' });

// AI operations
logger.aiAnalysis(inputText, outputData, 1500);

// Performance tracking
logger.performance('database-query', 250);

// Errors with context
logger.error('Failed to save', error, { userId: 123 });
```

**Log Categories**:

- `user-interaction` - User actions and interactions
- `ai-analysis` - AI service operations
- `liturgy-management` - Liturgy-related operations
- `performance` - Performance metrics
- `error` - Error tracking
- `security` - Security-related events
- `system` - System events (startup, shutdown)

### Settings Management Pattern (From Previous Project)

**Purpose**: Centralized application settings with type safety

**Settings Structure**:

```typescript
interface AppSettings {
  ai: {
    ollamaUrl: string;
    primaryModel: string;
    fallbackModel: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
  };
  database: {
    dbPath: string;
    backupEnabled: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    retentionDays: number;
  };
  youtube: {
    enabled: boolean;
    downloadFolder: string;
    quality: 'highest' | '720p' | '480p' | 'audio';
  };
  logging: {
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    rotationPattern: 'daily' | 'weekly' | 'monthly';
    retentionMonths: number;
  };
  interface: {
    theme: 'light' | 'dark' | 'auto';
    language: 'pt-BR' | 'en-US';
    defaultView: 'main-space' | 'stream-space' | 'unified-mode';
  };
  network: {
    communicationPort: number;
    connectionTimeout: number;
    maxRetries: number;
    enableInterSpaceComm: boolean;
  };
}
```

**Example Usage**:

```typescript
import { useSettings } from './composables/useSettings';

const { settings, loadSettings, saveSettings } = useSettings();

// Load settings on app start
await loadSettings();

// Access settings
const ollamaUrl = settings.value.ai.ollamaUrl;

// Update settings
settings.value.ai.primaryModel = 'deepseek-r1:7b';
await saveSettings();
```

### Service Architecture Pattern

**AI Service** (Ollama Integration):

```typescript
// Conceptual structure (to be implemented)
class OllamaService {
  async analyzeText(text: string, options: AIOptions): Promise<Analysis> {
    // 1. Connect to local Ollama
    // 2. Send prompt with system context
    // 3. Parse structured response
    // 4. Return typed analysis
  }
}
```

**YouTube Service** (yt-dlp Wrapper):

```typescript
// Conceptual structure (to be implemented)
class YouTubeService {
  async downloadVideo(url: string, options: DownloadOptions): Promise<void> {
    // 1. Validate URL
    // 2. Execute yt-dlp command
    // 3. Monitor progress
    // 4. Return file path
  }

  async extractMetadata(url: string): Promise<VideoMetadata> {
    // Extract title, duration, thumbnail
  }
}
```

### Communication Layer (IPC)

**Electron IPC Pattern**:

````typescript
### Communication Layer (IPC)

**Electron IPC Pattern**:
```typescript
// Main Process (desktop-main/src/app/api)
ipcMain.handle('liturgy:analyze', async (event, text: string) => {
  const result = await aiService.analyze(text);
  return result;
});

// Renderer Process (frontend-main)
const result = await ipcRenderer.invoke('liturgy:analyze', textInput);
````

---

## NestJS Module Structure

### Module Pattern Overview

NestJS uses a **modular architecture** where each feature has its own self-contained module. The project follows the **Module-Controller-Service pattern** with dependency injection.

### Basic Module Structure

**File Organization**:

```
src/
├── app/
│   ├── app.module.ts       # Root module
│   ├── app.controller.ts   # Root controller
│   └── app.service.ts      # Root service
└── features/
    └── liturgy/
        ├── liturgy.module.ts
        ├── liturgy.controller.ts
        ├── liturgy.service.ts
        └── liturgy.entity.ts
```

### Root Module (Current Implementation)

**apps/backend-main/src/app/app.module.ts**:

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [], // Feature modules
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### Feature Module Pattern

**Example: Liturgy Module** (to be implemented):

```typescript
// liturgy.module.ts
import { Module } from '@nestjs/common';
import { LiturgyController } from './liturgy.controller';
import { LiturgyService } from './liturgy.service';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [AIModule], // Import dependencies
  controllers: [LiturgyController], // HTTP endpoints
  providers: [LiturgyService], // Injectable services
  exports: [LiturgyService], // Export for other modules
})
export class LiturgyModule {}
```

### Controller Pattern

```typescript
// liturgy.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { LiturgyService } from './liturgy.service';

@Controller('liturgy') // /api/liturgy prefix
export class LiturgyController {
  constructor(private readonly liturgyService: LiturgyService) {}

  @Post('analyze') // POST /api/liturgy/analyze
  async analyze(@Body('text') text: string) {
    return this.liturgyService.analyzeText(text);
  }

  @Get(':id') // GET /api/liturgy/:id
  async findOne(@Param('id') id: string) {
    return this.liturgyService.findById(id);
  }
}
```

### Service Pattern with Dependency Injection

```typescript
// liturgy.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AIService } from '../ai/ai.service';

@Injectable()
export class LiturgyService {
  private readonly logger = new Logger(LiturgyService.name);

  constructor(private readonly aiService: AIService) {}

  async analyzeText(text: string): Promise<Analysis> {
    this.logger.log(`Analyzing liturgy text: ${text.substring(0, 50)}...`);

    try {
      const result = await this.aiService.analyze(text);
      return result;
    } catch (error) {
      this.logger.error('Analysis failed', error.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<Liturgy> {
    return { id, content: '...' };
  }
}
```

### Key NestJS Patterns

#### 1. Dependency Injection

- **Constructor injection** is preferred
- Services must be decorated with `@Injectable()`
- Register providers in module's `providers` array

#### 2. Module Imports/Exports

- **Import** modules you depend on
- **Export** services/providers that other modules need
- Use `@Global()` decorator sparingly

#### 3. Exception Handling

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

throw new HttpException('Liturgy not found', HttpStatus.NOT_FOUND);
```

#### 4. Async Operations

- Use `async/await` for all asynchronous operations
- Return `Promise<T>` types explicitly

### Module Integration into AppModule

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { LiturgyModule } from '../features/liturgy/liturgy.module';
import { AIModule } from '../features/ai/ai.module';

@Module({
  imports: [
    LiturgyModule,
    AIModule,
    // Other feature modules
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

---

## Electron Desktop & IPC Communication

### Electron Architecture

The desktop app consists of three main parts:

1. **Main Process** - Node.js backend (desktop-main/src/main.ts)
2. **Renderer Process** - Nuxt 3 frontend (frontend-main)
3. **Preload Script** - Secure IPC bridge

### Main Process Structure

**Entry Point** (apps/desktop-main/src/main.ts):

- Handles Squirrel installer events
- Bootstraps Electron app
- Initializes auto-updater (disabled in dev)

**App Class** (apps/desktop-main/src/app/app.ts):

- Manages BrowserWindow lifecycle
- Detects development mode
- Handles window events

### IPC Communication Patterns

#### 1. Preload Script (Security Bridge)

**apps/desktop-main/src/app/api/main.preload.ts**:

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  platform: process.platform,
});
```

**Purpose**: Safely expose IPC methods to renderer without full Node.js access.

#### 2. IPC Handlers (Main Process)

**apps/desktop-main/src/app/events/electron.events.ts**:

```typescript
import { app, ipcMain } from 'electron';

// Request-Response pattern (async)
ipcMain.handle('get-app-version', (event) => {
  console.log(`Fetching application version...`);
  return environment.version;
});

// Fire-and-forget pattern (sync)
ipcMain.on('quit', (event, code) => {
  app.exit(code);
});
```

#### 3. IPC Usage in Renderer

**Frontend (Nuxt/Vue component)**:

```typescript
// Request-Response
const version = await window.electron.getAppVersion();

// With error handling
try {
  const result = await window.electron.liturgyAnalyze(text);
} catch (error) {
  console.error('IPC call failed', error);
}
```

### IPC Best Practices

#### Security

- **Always use preload scripts** - Never disable `contextIsolation`
- **Validate all inputs** in main process handlers
- **Whitelist exposed APIs** - Only expose what's needed
- **Never pass sensitive data** through IPC without encryption

#### Performance

- **Use `handle` for async operations** (returns Promise)
- **Use `on` for fire-and-forget** events
- **Batch IPC calls** when possible to reduce overhead
- **Stream large data** instead of single large payloads

#### Error Handling

```typescript
// Main Process
ipcMain.handle('risky-operation', async (event, data) => {
  try {
    return await performOperation(data);
  } catch (error) {
    console.error('Operation failed', error);
    throw new Error(`Operation failed: ${error.message}`);
  }
});

// Renderer Process
try {
  const result = await window.electron.riskyOperation(data);
} catch (error) {
  // Handle error in UI
  showErrorNotification(error.message);
}
```

### Event System Structure

**Current Event Files**:

- `electron.events.ts` - Core IPC handlers (app version, quit)
- `squirrel.events.ts` - Windows installer events
- `update.events.ts` - Auto-update event handlers

**Event Registration** (in main.ts):

```typescript
import ElectronEvents from './app/events/electron.events';

ElectronEvents.bootstrapElectronEvents();
```

### Multi-Window Communication

For **Main Space**, **Stream Space**, and **Unified Mode**:

```typescript
// Main Process - Broadcast to all windows
import { BrowserWindow } from 'electron';

function broadcastToAllWindows(channel: string, data: any) {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(channel, data);
  });
}

ipcMain.handle('liturgy:update', (event, liturgy) => {
  broadcastToAllWindows('liturgy:changed', liturgy);
  return { success: true };
});

// Renderer Process - Listen for broadcasts
window.electron.onLiturgyChanged((liturgy) => {
  updateUI(liturgy);
});
```

---

## External Integrations

### 1. Ollama AI Service (Local)

**Purpose**: Local AI for liturgy analysis using deepseek-r1 models

**Connection Pattern**:

```typescript
// Conceptual implementation
class OllamaService {
  private readonly baseUrl = 'http://localhost:11434';

  async analyzeText(text: string): Promise<AIAnalysis> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-r1:7b',
        prompt: this.buildPrompt(text),
        stream: false,
      }),
    });

    return this.parseResponse(await response.json());
  }

  private buildPrompt(text: string): string {
    return `Analyze this Brazilian church liturgy text:\n\n${text}`;
  }
}
```

**Key Considerations**:

- **Local-first**: Ollama runs on user's machine (privacy)
- **Model selection**: Primary `deepseek-r1:7b`, fallback `deepseek-r1:1.5b`
- **Temperature control**: Configurable via settings
- **Error handling**: Graceful degradation if Ollama unavailable

### 2. Jina AI Service (Cloud)

**Purpose**: Cloud-based AI for advanced analysis and embeddings

**Integration Pattern**:

```typescript
// Conceptual implementation
class JinaService {
  private readonly apiKey = process.env.JINA_API_KEY;
  private readonly baseUrl = 'https://api.jina.ai/v1';

  async embedText(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: text }),
    });

    const data = await response.json();
    return data.embedding;
  }
}
```

**Key Considerations**:

- **API key management**: Store securely in environment variables
- **Rate limiting**: Implement retry logic with exponential backoff
- **Fallback**: Use Ollama if Jina unavailable

### 3. YouTube Service (yt-dlp)

**Purpose**: Download videos and extract metadata for worship services

**Integration Pattern**:

```typescript
// Conceptual implementation
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class YouTubeService {
  async downloadVideo(url: string, quality: string): Promise<string> {
    const outputPath = './downloads/%(title)s.%(ext)s';

    const command = `yt-dlp -f "${quality}" -o "${outputPath}" "${url}"`;

    const { stdout, stderr } = await execAsync(command);

    return this.extractFilePath(stdout);
  }

  async extractMetadata(url: string): Promise<VideoMetadata> {
    const command = `yt-dlp --dump-json "${url}"`;

    const { stdout } = await execAsync(command);

    return JSON.parse(stdout);
  }
}
```

**Key Considerations**:

- **yt-dlp binary**: Must be available in system PATH
- **Progress tracking**: Implement progress bar for downloads
- **Quality options**: `highest`, `720p`, `480p`, `audio`
- **Error handling**: Handle network errors, invalid URLs

### Integration Architecture

```
Electron Main Process
  ├─> OllamaService (localhost:11434)
  ├─> JinaService (api.jina.ai)
  └─> YouTubeService (yt-dlp binary)

IPC Bridge
  ├─> ipcMain.handle('ai:analyze')
  ├─> ipcMain.handle('ai:embed')
  └─> ipcMain.handle('youtube:download')

Renderer Process (Nuxt)
  └─> window.electron.aiAnalyze(text)
```

---

## MCP Tools Utilization

### Available MCP Tools

AI agents have access to powerful **Model Context Protocol (MCP)** tools for enhanced capabilities:

#### 1. Sequential Thinking Tool

**Purpose**: Deep cognitive analysis for complex problems

**When to Use**:

- Complex multi-step problems
- Architectural decisions
- Debugging intricate issues
- Planning major features

**Example**:

```typescript
// AI Agent uses this internally when encountering complexity
mcp_sequential -
  th_sequentialthinking({
    thought: 'Analyzing the module boundary violation...',
    thoughtNumber: 1,
    totalThoughts: 5,
    nextThoughtNeeded: true,
  });
```

#### 2. Context7 Library Documentation

**Purpose**: Fetch up-to-date library documentation

**When to Use**:

- Implementing new library features
- Understanding API changes
- Verifying best practices

**Usage Pattern**:

```typescript
// 1. Resolve library ID
mcp_context7_resolve - library - id({ libraryName: 'nestjs' });

// 2. Fetch documentation
mcp_context7_get -
  library -
  docs({
    context7CompatibleLibraryID: '/nestjs/nest',
    topic: 'dependency injection',
    tokens: 5000,
  });
```

#### 3. User Input Tool

**Purpose**: Request clarification from user

**When to Use**:

- Ambiguous requirements
- Critical decisions needed
- Multiple valid approaches

**Example**:

```typescript
mcp_user -
  prompt -
  m_user_prompt({
    title: 'Clarification Needed',
    prompt:
      'Should the AI service use Ollama (local) or Jina (cloud) by default?',
  });
```

#### 4. Git Tools

**Purpose**: Version control operations

**Available Operations**:

- `git_status` - Check repository state
- `git_diff_unstaged` - View changes
- `git_add` - Stage files
- `git_commit` - Commit changes
- `git_log` - View history

#### 5. Nx MCP Tools

**Purpose**: Workspace and project management

**Key Tools**:

- `nx_workspace` - Get workspace overview
- `nx_project_details` - Analyze specific project
- `nx_docs` - Search Nx documentation
- `nx_visualize_graph` - View dependency graph

**Example Usage**:

```typescript
// Understand project structure
nx_project_details({ projectName: '@house-mix-copilot/backend-main' });

// Search for best practices
nx_docs({ query: 'module boundaries best practices' });
```

### MCP Tool Best Practices

#### When to Use Sequential Thinking

```typescript
// ✅ GOOD: Complex architectural decision
"I need to decide between monolithic vs microservices for AI integration"
→ Use sequential_thinking

// ❌ UNNECESSARY: Simple code fix
"Add a new endpoint to existing controller"
→ Just implement directly
```

#### When to Use Context7

```typescript
// ✅ GOOD: Using new library feature
"Implementing NestJS guards for authentication"
→ Fetch Context7 docs for /nestjs/nest on "guards"

// ✅ GOOD: Verifying API changes
"Is @nestjs/common v11 API different from v10?"
→ Fetch Context7 docs to verify
```

#### When to Use User Input

```typescript
// ✅ GOOD: Ambiguous requirement
"User said 'improve performance' - need to clarify which area"
→ Use user_prompt

// ❌ AVOID: For decisions agent can make
"Should I use const or let?"
→ Follow TypeScript best practices (prefer const)
```

---

## Troubleshooting & Common Errors

### 1. ESLint Module Boundary Violations

**Error**:

```
Error: Projects cannot be imported by a project that doesn't have
matching tags: @nx/enforce-module-boundaries
```

**Cause**: Importing from wrong project/layer

**Fix**:

```typescript
// ❌ WRONG: Direct import from another app
import { Service } from '../../../other-app/src/service';

// ✅ CORRECT: Import from shared library
import { Service } from '@house-mix-copilot/shared';
```

**Prevention**:

- Create shared libraries for common code
- Respect architectural boundaries
- Check `nx.json` depConstraints

### 2. TypeScript Strict Mode Errors

**Error**: `Type 'X | undefined' is not assignable to type 'X'`

**Cause**: Strict null checks enabled

**Fix**:

```typescript
// ❌ ERROR
const user = users.find((u) => u.id === id);
console.log(user.name); // user might be undefined

// ✅ FIX 1: Guard clause
const user = users.find((u) => u.id === id);
if (!user) throw new Error('User not found');
console.log(user.name);

// ✅ FIX 2: Optional chaining
console.log(user?.name);
```

### 3. Missing Return Statements

**Error**: `Not all code paths return a value`

**Cause**: `noImplicitReturns: true` in tsconfig

**Fix**:

```typescript
// ❌ ERROR
function getStatus(code: number): string {
  if (code === 200) {
    return 'OK';
  }
  // Missing return for other cases
}

// ✅ FIX
function getStatus(code: number): string {
  if (code === 200) {
    return 'OK';
  }
  return 'Error';
}
```

### 4. Nx Cache Issues

**Symptom**: Builds failing with stale cache

**Fix**:

```bash
# Clear Nx cache
nx reset

# Rebuild
nx build <project>
```

### 5. Electron IPC Not Working

**Symptom**: `window.electron is undefined` in renderer

**Cause**: Preload script not loaded or contextIsolation disabled

**Fix**:

```typescript
// 1. Verify preload script path in BrowserWindow
const mainWindow = new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true, // Must be true
    nodeIntegration: false, // Must be false
  },
});

// 2. Ensure preload script exposes APIs
contextBridge.exposeInMainWorld('electron', {
  // Your APIs here
});
```

### 6. NestJS Dependency Injection Errors

**Error**: `Nest can't resolve dependencies of Service (?)`

**Cause**: Service not provided in module or circular dependency

**Fix**:

```typescript
// ❌ ERROR: Service not in providers
@Module({
  controllers: [MyController],
  providers: [],  // Missing MyService
})

// ✅ FIX
@Module({
  controllers: [MyController],
  providers: [MyService],
})
```

### 7. Vitest/Jest Path Resolution

**Error**: `Cannot find module '@/components/...'`

**Cause**: Path aliases not configured in test config

**Fix**:

```typescript
// vitest.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 8. Build Failures After Package Updates

**Symptom**: `Module not found` or type errors after `yarn install`

**Fix**:

```bash
# 1. Clean install
rm -rf node_modules yarn.lock
yarn install

# 2. Rebuild Electron native modules
yarn postinstall

# 3. Clear Nx cache
nx reset

# 4. Rebuild
nx build <project>
```

### 9. ESLint Auto-Fix Not Working

**Symptom**: `nx lint --fix` doesn't fix issues

**Cause**: Some rules can't be auto-fixed

**Fix**:

```bash
# 1. Run lint to see unfixable issues
nx lint <project>

# 2. Run auto-fix
nx lint <project> --fix

# 3. Manually fix remaining issues
# (usually module boundaries, unused variables)
```

### 10. Test Coverage Below Threshold

**Error**: `Coverage for statements (65%) does not meet threshold (70%)`

**Fix**:

```typescript
// Add missing tests for uncovered code paths

// Check coverage report
nx test <project> --coverage

// Open HTML report
open test-output/jest/coverage/<project>/index.html
```

### Common AI Agent Mistakes (Prevention)

⚠️ **AI agents frequently make these mistakes:**

1. **Not running lint before completing**
   - ALWAYS run `nx lint <project>` before marking task complete
2. **Using wrong commands**

   - Use `yarn nxe:*` commands, not direct `nx` commands
   - Check `package.json` for available commands

3. **Ignoring TypeScript strict mode**

   - Don't use `// @ts-ignore` without good reason
   - Fix type errors properly

4. **Breaking module boundaries**

   - Don't import directly from other apps
   - Use shared libraries for common code

5. **Incomplete error handling**

   - Always handle Promise rejections
   - Add try-catch blocks for async operations

6. **Not testing changes**
   - Run tests after every change
   - Verify builds pass

---

## Summary & Quick Reference

### Critical Workflow Checklist

✅ **Before Starting**:

- [ ] Use MCP tools to gather context (nx_workspace, nx_project_details)
- [ ] Read relevant files and documentation
- [ ] Use sequential_thinking for complex problems

✅ **During Development**:

- [ ] Follow 6-phase systematic approach
- [ ] Make incremental changes
- [ ] Test after each change
- [ ] Ask for clarification when needed (user_prompt)

✅ **Before Committing**:

- [ ] Run `nx lint <project>` (MANDATORY)
- [ ] Run `nx test <project>`
- [ ] Run `nx build <project>`
- [ ] Verify all package.json commands work

### Essential Commands Reference

| Task                | Command                            |
| ------------------- | ---------------------------------- |
| **Serve frontend**  | `yarn nxe:serve:frontend`          |
| **Serve backend**   | `yarn nxe:serve:backend`           |
| **Build all**       | `nx run-many --target=build --all` |
| **Test all**        | `nx run-many --target=test --all`  |
| **Lint (CRITICAL)** | `nx affected --target=lint`        |
| **Clear cache**     | `nx reset`                         |
| **View graph**      | `nx graph`                         |

### Key Architecture Decisions

- **IPC over gRPC**: Electron IPC for front-back communication
- **Strict TypeScript**: All strict mode rules enabled
- **70% Coverage**: Minimum test coverage requirement
- **Local-First AI**: Ollama for local AI analysis
- **Module Boundaries**: Enforced by ESLint Nx plugin
- **Dual Testing**: Jest (backend) + Vitest (frontend)

---

**This AGENTS.md file is the definitive guide for all AI coding agents working on the House Mix Copilot project. Follow it rigorously to ensure code quality, architectural consistency, and prevent repeated refactoring cycles.**

```

```
