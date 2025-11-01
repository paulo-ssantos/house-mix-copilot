# Church Liturgy Copilot - Comprehensive Project Documentation

## Executive Summary
* IMPORTANT: This documentation corresponds to the previous and deprecated implementation of the Church Liturgy Copilot project, which utilized Nuxt 3, Electron, NestJS, and SQLite. Careful consideration should be given before using this as a reference for new projects, as the architecture and technologies may have evolved in subsequent versions. This must be used primarily for base UI and feature reference only, but always cross-check and critically think in the relevance of the information in the context of current best practices and technologies.

**Church Liturgy Copilot** is a sophisticated desktop application designed to revolutionize church liturgy management, sound design, and live streaming coordination. Built with modern web technologies wrapped in Electron, it provides a comprehensive solution for churches to manage worship services efficiently.

### Project Vision

Transform the workflow of church worship services by providing AI-powered liturgy analysis, real-time control systems, YouTube content integration, and professional streaming capabilities in a single, unified desktop application.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Features](#core-features)
5. [UI/UX Design](#uiux-design)
6. [Application Modes](#application-modes)
7. [Key Components](#key-components)
8. [Backend Services](#backend-services)
9. [Data Flow](#data-flow)
10. [Development Workflow](#development-workflow)
11. [Migration Guide for NX + Nuxt + NestJS + Electron](#migration-guide)

---

## Architecture Overview

### High-Level Architecture

The application follows a **monorepo architecture** using Yarn Workspaces, organized into three main layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Desktop App                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Multi-Window Management Layer               │ │
│  │  (Manages 3 independent Nuxt applications)             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Main Space  │    │Stream Space  │    │Unified Mode  │
│   (Nuxt 3)   │    │   (Nuxt 3)   │    │   (Nuxt 3)   │
│  Port: 3000  │    │  Port: 3001  │    │  Port: 3002  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Shared Packages   │
                    │  ┌──────────────┐  │
                    │  │   Shared     │  │
                    │  │   Database   │  │
                    │  │  AI Service  │  │
                    │  │   YouTube    │  │
                    │  │Communication │  │
                    │  └──────────────┘  │
                    └────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  SQLite DB   │    │    Ollama    │    │   yt-dlp     │
│ (via Drizzle)│    │  (Local AI)  │    │  (YouTube)   │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Architectural Principles

1. **Separation of Concerns**: Each application mode has its own Nuxt instance with dedicated purpose
2. **Code Reusability**: Shared packages provide common functionality across all applications
3. **Type Safety**: Full TypeScript implementation with Zod schema validation
4. **Security First**: API keys and sensitive data handled server-side only
5. **Real-Time Communication**: WebSocket and IPC for cross-application synchronization
6. **Offline Capability**: Local AI processing with Ollama, no cloud dependencies

---

## Technology Stack

### Frontend Layer

| Technology | Version | Purpose |
|------------|---------|---------|
| **Nuxt 3** | 3.13.2 | Vue.js framework for building the UI applications |
| **Vue 3** | 3.4.38 | Progressive JavaScript framework |
| **TypeScript** | 5.7.2 | Type-safe development |
| **Nuxt UI** | 2.18.7 | Pre-built UI components with Tailwind CSS |
| **Tailwind CSS** | 6.8.4 | Utility-first CSS framework |
| **Pinia** | 2.2.6 | State management |
| **VueUse** | 13.6.0 | Collection of Vue composition utilities |

### Desktop Layer

| Technology | Version | Purpose |
|------------|---------|---------|
| **Electron** | 33.2.1 | Desktop application framework |
| **Electron Builder** | 25.1.8 | Application packaging and distribution |

### Backend Services

| Technology | Version | Purpose |
|------------|---------|---------|
| **SQLite** | via better-sqlite3 | Local database storage |
| **Drizzle ORM** | 0.44.4 | Type-safe database operations |
| **Ollama** | 0.5.8 | Local AI model integration |
| **yt-dlp** | External | YouTube video downloading |
| **Axios** | 1.11.0 | HTTP client for API requests |

### Build Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vite** | 5.4.5 | Fast build tool and dev server |
| **Yarn** | 4.9.2 | Package manager with workspaces |
| **TypeScript Compiler** | 5.7.2 | TypeScript compilation |

### Additional Libraries

- **vue-draggable-next**: Drag and drop functionality for liturgy items
- **sortablejs**: Advanced sorting and reordering
- **winston**: Professional logging framework
- **concurrently**: Running multiple processes simultaneously

---

## Project Structure

### Monorepo Organization

```
church-liturgy-copilot/
│
├── apps/                          # Nuxt 3 Applications
│   ├── main-space/               # Primary liturgy management interface
│   │   ├── components/           # Vue components
│   │   │   ├── liturgy/         # Liturgy-specific components
│   │   │   ├── youtube/         # YouTube integration components
│   │   │   ├── settings/        # Settings management
│   │   │   ├── templates/       # Template system components
│   │   │   └── help/            # Help and documentation
│   │   ├── composables/         # Vue composables (hooks)
│   │   ├── pages/               # Nuxt pages (routing)
│   │   ├── server/              # Nuxt server API routes
│   │   │   └── api/
│   │   │       ├── liturgy/     # Liturgy API endpoints
│   │   │       ├── youtube/     # YouTube API endpoints
│   │   │       ├── ai/          # AI analysis endpoints
│   │   │       └── system/      # System utilities
│   │   ├── assets/              # Static assets (CSS, images)
│   │   ├── utils/               # Utility functions
│   │   ├── app.vue              # Root application component
│   │   ├── nuxt.config.ts       # Nuxt configuration
│   │   └── package.json         # Dependencies
│   │
│   ├── stream-space/            # Streaming and presentation interface
│   │   ├── pages/
│   │   ├── components/
│   │   ├── app.vue
│   │   └── nuxt.config.ts
│   │
│   └── unified-mode/            # Combined interface mode
│       ├── pages/
│       ├── components/
│       ├── app.vue
│       └── nuxt.config.ts
│
├── packages/                     # Shared Packages
│   ├── shared/                  # Common types and schemas
│   │   ├── src/
│   │   │   ├── types/          # TypeScript type definitions
│   │   │   ├── schemas/        # Zod validation schemas
│   │   │   └── index.ts        # Package exports
│   │   └── package.json
│   │
│   ├── database/                # Database layer with Drizzle ORM
│   │   ├── src/
│   │   │   ├── schema.ts       # Database schema definitions
│   │   │   ├── repositories/   # Data access repositories
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── ai-service/              # Ollama AI integration
│   │   ├── src/
│   │   │   ├── ollama-client.ts
│   │   │   ├── liturgy-analyzer.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── jina-service/            # Jina AI (alternative AI service)
│   │   ├── src/
│   │   │   ├── jina-client.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── youtube-service/         # YouTube integration with yt-dlp
│   │   ├── src/
│   │   │   ├── downloader.ts
│   │   │   ├── queue.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── communication/           # WebSocket/IPC communication
│       ├── src/
│       │   ├── websocket.ts
│       │   ├── ipc.ts
│       │   └── index.ts
│       └── package.json
│
├── electron/                     # Electron Main Process
│   ├── main/
│   │   └── index.ts             # Main Electron entry point
│   ├── dist/                    # Compiled Electron code
│   └── package.json
│
├── docs/                        # Documentation
│   ├── COMPREHENSIVE-PROJECT-DOCUMENTATION.md
│   ├── DEVELOPMENT.md
│   ├── CHANGELOG.md
│   └── QUICKSTART.md
│
├── locales/                     # Internationalization (Portuguese)
│   └── pt-BR.json
│
├── package.json                 # Root package configuration
├── tsconfig.json                # TypeScript configuration
├── yarn.lock                    # Dependency lock file
└── README.md                    # Project overview
```

### Key Directory Purposes

#### **apps/main-space**
Primary user interface for liturgy management, including:
- Liturgy input and editing
- AI-powered analysis
- YouTube video integration
- Real-time control panel
- Template management

#### **apps/stream-space**
Dedicated interface for streaming and presentation:
- Connection to main space
- Presentation mode
- OBS integration (planned)
- Stream metadata generation

#### **apps/unified-mode**
Combined interface offering both main and stream functionality in a single view.

#### **packages/shared**
Core types, interfaces, and schemas used across all applications.

#### **packages/database**
Database layer with:
- Schema definitions
- Repository pattern for data access
- Migration support

#### **packages/ai-service**
AI integration for liturgy analysis:
- Ollama client integration
- Liturgy text parsing
- Content generation

#### **electron/**
Desktop application wrapper:
- Multi-window management
- IPC communication
- Application lifecycle

---

* IMPORTANT: This documentation corresponds to the previous and deprecated implementation of the Church Liturgy Copilot project, which utilized Nuxt 3, Electron, NestJS, and SQLite. Careful consideration should be given before using this as a reference for new projects, as the architecture and technologies may have evolved in subsequent versions. This must be used primarily for base UI and feature reference only, but always cross-check and critically think in the relevance of the information in the context of current best practices and technologies.