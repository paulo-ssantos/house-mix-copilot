# Church Liturgy Copilot - Documentation Index

## Welcome to the Comprehensive Documentation Suite

- IMPORTANT: This documentation corresponds to the previous and deprecated implementation of the Church Liturgy Copilot project, which utilized Nuxt 3, Electron, NestJS, and SQLite. Careful consideration should be given before using this as a reference for new projects, as the architecture and technologies may have evolved in subsequent versions. This must be used primarily for base UI and feature reference only, but always cross-check and critically think in the relevance of the information in the context of current best practices and technologies.

This documentation suite provides complete coverage of the Church Liturgy Copilot project, designed to help developers understand, maintain, and replicate this application architecture.

---

## 📚 Documentation Structure

### 🎯 Quick Start

**If you want to**: Get started immediately  
**Read**: [QUICKSTART.md](./QUICKSTART.md)  
**Contents**: Installation, basic usage, running the app

### 🏗️ Architecture & Technical Details

**If you want to**: Understand how the project is structured  
**Read**: [COMPREHENSIVE-PROJECT-DOCUMENTATION.md](./COMPREHENSIVE-PROJECT-DOCUMENTATION.md)  
**Contents**:

- Architecture overview
- Technology stack details
- Project structure walkthrough
- Backend services documentation
- Data flow diagrams
- Development workflow

### 🎨 UI/UX Features

**If you want to**: Understand the user interface and components  
**Read**: [UI-FEATURES-GUIDE.md](./UI-FEATURES-GUIDE.md)  
**Contents**:

- Complete UI component catalog
- Feature demonstrations
- User workflows
- Design system documentation
- Keyboard shortcuts
- Accessibility guidelines

### 🚀 Migration Guide

**If you want to**: Replicate this project with NX + NestJS + Electron  
**Read**: [PROJECT-SUMMARY-FOR-MIGRATION.md](./PROJECT-SUMMARY-FOR-MIGRATION.md)  
**Contents**:

- High-level project summary
- Technology stack comparison
- Step-by-step migration plan
- Key features to replicate
- Database schema
- API endpoints summary
- NX setup instructions

---

## 🎯 Documentation by Use Case

### For New Developers

Start here to understand the project:

1. Read [PROJECT-SUMMARY-FOR-MIGRATION.md](./PROJECT-SUMMARY-FOR-MIGRATION.md) for overview
2. Skim [UI-FEATURES-GUIDE.md](./UI-FEATURES-GUIDE.md) to see what it does
3. Follow [QUICKSTART.md](./QUICKSTART.md) to run it locally
4. Dive into [COMPREHENSIVE-PROJECT-DOCUMENTATION.md](./COMPREHENSIVE-PROJECT-DOCUMENTATION.md) for details

### For Architects Planning Similar Projects

Focus on these documents:

1. [COMPREHENSIVE-PROJECT-DOCUMENTATION.md](./COMPREHENSIVE-PROJECT-DOCUMENTATION.md) - Architecture section
2. [PROJECT-SUMMARY-FOR-MIGRATION.md](./PROJECT-SUMMARY-FOR-MIGRATION.md) - Technology decisions

### For UI/UX Designers

Focus on:

1. [UI-FEATURES-GUIDE.md](./UI-FEATURES-GUIDE.md) - Complete UI reference
2. Visual design system section
3. User workflow documentation
4. Component catalog

### For Backend Developers

Focus on:

1. [COMPREHENSIVE-PROJECT-DOCUMENTATION.md](./COMPREHENSIVE-PROJECT-DOCUMENTATION.md) - Backend Services section
2. [PROJECT-SUMMARY-FOR-MIGRATION.md](./PROJECT-SUMMARY-FOR-MIGRATION.md) - API endpoints
3. Database schema documentation

### For DevOps Engineers

Focus on:

1. [DEVELOPMENT.md](./DEVELOPMENT.md) - Build and deployment
2. [COMPREHENSIVE-PROJECT-DOCUMENTATION.md](./COMPREHENSIVE-PROJECT-DOCUMENTATION.md) - Technology stack
3. Docker configuration (if applicable)
4. CI/CD pipeline requirements

---

## 📊 Project Overview

### What is Church Liturgy Copilot?

A sophisticated **desktop application** for churches to manage worship services, combining:

- 🤖 **AI-powered liturgy analysis** (using local Ollama)
- 🎵 **YouTube video integration** (with yt-dlp)
- ⏱️ **Real-time worship control** (live timer and navigation)
- 📡 **Multi-mode operation** (Main, Stream, Unified)
- 💾 **Local-first architecture** (SQLite database)
- 🖥️ **Cross-platform desktop** (Electron)

### Technology Highlights

```
Frontend:  Nuxt 3 + Vue 3 + TypeScript + Tailwind CSS + Nuxt UI
Desktop:   Electron 33
Backend:   Nuxt Server Routes (Nitro)
Database:  SQLite + Drizzle ORM
AI:        Ollama (Local) + Jina AI (Cloud)
YouTube:   yt-dlp (CLI wrapper)
Monorepo:  Yarn Workspaces
```

### Key Statistics

- **3** Nuxt applications (Multi-window architecture)
- **6** Shared packages (Reusable business logic)
- **1** Electron wrapper (Desktop integration)
- **~15,000+** Lines of TypeScript code
- **100%** TypeScript with strict mode
- **90%+** Type coverage

---

## 🗺️ Documentation Map

```
docs/
├── README-DOCUMENTATION.md              ← You are here
│
├── 🎯 Getting Started
│   ├── QUICKSTART.md                    Quick start guide
│
├── 🏗️ Architecture
│   ├── COMPREHENSIVE-PROJECT-DOCUMENTATION.md  Main technical docs
│   └── PROJECT-SUMMARY-FOR-MIGRATION.md       Migration guide
│
├── 🎨 UI/UX
│   └── UI-FEATURES-GUIDE.md             Complete UI reference
```

---

## 🔑 Key Concepts

### Monorepo Structure

The project uses **Yarn Workspaces** to manage multiple packages in a single repository, allowing code sharing and consistent versioning.

### Multi-Mode Architecture

Three distinct operational modes:

1. **Main Space** (Port 3000): Primary liturgy management
2. **Stream Space** (Port 3001): Presentation and streaming
3. **Unified Mode** (Port 3002): Combined interface

### Local-First Design

All core functionality works offline:

- Local SQLite database
- Local AI with Ollama
- Downloaded media stored locally
- No cloud dependencies for core features

### Type-Safe Development

Comprehensive TypeScript usage with:

- Strict mode enabled
- Zod schema validation
- Shared type definitions
- Compile-time safety

---

**Documentation Suite Version**: 1.0  
**Last Updated**: October 31, 2025  
**Maintained By**: Development Team  
**Status**: Active & Complete

- IMPORTANT: This documentation corresponds to the previous and deprecated implementation of the Church Liturgy Copilot project, which utilized Nuxt 3, Electron, NestJS, and SQLite. Careful consideration should be given before using this as a reference for new projects, as the architecture and technologies may have evolved in subsequent versions. This must be used primarily for base UI and feature reference only, but always cross-check and critically think in the relevance of the information in the context of current best practices and technologies.
