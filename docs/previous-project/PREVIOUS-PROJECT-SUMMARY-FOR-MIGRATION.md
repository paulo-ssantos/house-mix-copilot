# Church Liturgy Copilot - Project Summary for Migration

## Quick Overview

Church Liturgy Copilot is a desktop application for managing church worship services, built as a Yarn Workspaces monorepo with Electron, Nuxt 3, and local AI integration. This document provides a high-level summary for teams planning to replicate this architecture using NX, Nuxt, NestJS, and Electron.

---

## Project At A Glance

### Core Purpose
Transform church liturgy management through:
- AI-powered liturgy text analysis
- Real-time worship service control
- YouTube video integration
- Professional streaming support
- Multi-mode operation (Main Space, Stream Space, Unified)

### Key Statistics
- **3 Nuxt Applications**: Main Space, Stream Space, Unified Mode
- **6 Shared Packages**: Database, AI Service, YouTube Service, Communication, Shared Types, Jina Service
- **1 Electron Wrapper**: Multi-window desktop application
- **Languages**: TypeScript 100%, Vue 3 SFC
- **Lines of Code**: ~15,000+ across all packages
- **Development Status**: Phase 1 Complete, Production-Ready Core

---

## Architecture Summary

```
┌──────────────────────────────────────┐
│        Electron Desktop App          │
│   (Multi-Window Management)          │
└──────────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼───┐  ┌────▼────┐  ┌───▼────┐
│ Main  │  │ Stream  │  │Unified │
│ Space │  │ Space   │  │  Mode  │
│:3000  │  │ :3001   │  │ :3002  │
└───┬───┘  └────┬────┘  └───┬────┘
    │            │            │
    └────────────┼────────────┘
                 │
        ┌────────▼─────────┐
        │ Shared Packages   │
        │ - Database        │
        │ - AI Service      │
        │ - YouTube Service │
        │ - Communication   │
        │ - Shared Types    │
        └───────────────────┘
                 │
        ┌────────┼─────────┐
        │        │         │
    ┌───▼───┐ ┌─▼──┐ ┌────▼──┐
    │SQLite │ │AI  │ │yt-dlp │
    └───────┘ └────┘ └───────┘
```

---

## Technology Stack Comparison

### Current Stack
| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | Nuxt 3 | 3.13.2 | UI Framework |
| Desktop | Electron | 33.2.1 | Desktop Wrapper |
| Database | SQLite + Drizzle | 0.44.4 | Local Storage |
| AI | Ollama | 0.5.8 | Local AI Processing |
| YouTube | yt-dlp | Latest | Video Downloading |
| Package Manager | Yarn Workspaces | 4.9.2 | Monorepo |

### Recommended NX Stack
| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Nuxt 3 | Same (proven) |
| Backend | NestJS | Better API architecture |
| Desktop | Electron | Same |
| Database | Prisma + SQLite | Better DX, type safety |
| AI | Ollama/OpenAI | Flexibility |
| YouTube | yt-dlp | Same (proven) |
| Monorepo | NX | Better tooling, caching, DX |

---

## Core Features to Replicate

### 1. AI-Powered Liturgy Analysis
**What It Does**: Parses raw liturgy text and creates structured timeline items.

**Key Components**:
- Textarea for raw input
- AI service integration (Ollama)
- Result parsing and validation
- Timeline item creation
- YouTube link extraction

**Implementation Notes**:
- Use streaming responses for better UX
- Implement retry logic
- Cache results
- Validate with Zod schemas

### 2. Drag-and-Drop Timeline
**What It Does**: Interactive liturgy item management with reordering.

**Key Components**:
- SortableJS or vue-draggable-next
- Visual drag feedback
- State persistence
- Item type badges
- Edit/Delete actions

**Implementation Notes**:
- Use Vue transitions
- Implement optimistic updates
- Save order to database
- Support keyboard navigation

### 3. Real-Time Control System
**What It Does**: Live control panel for worship service execution.

**Key Components**:
- Timer (accurate to second)
- Play/Pause/Stop controls
- Item navigation
- Completion tracking
- Elapsed time calculation

**Implementation Notes**:
- Use setInterval for timer
- Pause accumulation logic
- Emit events for synchronization
- Persist state across refreshes

### 4. YouTube Integration
**What It Does**: Downloads and manages worship media.

**Key Components**:
- yt-dlp wrapper
- Download queue
- Progress tracking
- File management
- Metadata extraction

**Implementation Notes**:
- Use child_process for yt-dlp
- Parse progress from stdout
- Implement queue with priorities
- Store metadata in database

### 5. Settings Management
**What It Does**: Comprehensive app configuration.

**Key Areas**:
- AI settings (Ollama URL, models)
- YouTube settings (quality, format)
- General settings (theme, language)
- Stream settings (OBS integration)

**Implementation Notes**:
- Use composable for settings
- LocalStorage + Database persistence
- Validation on save
- Default values

### 6. Multi-Window Architecture
**What It Does**: Runs multiple Nuxt apps in separate Electron windows.

**Key Components**:
- Electron main process
- BrowserWindow management
- IPC communication
- Window state persistence

**Implementation Notes**:
- Use preload scripts
- Context isolation
- Secure IPC channels
- Window bounds memory

---

## Database Schema

### Core Tables

**liturgies**
```sql
CREATE TABLE liturgies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date DATETIME NOT NULL,
  church TEXT,
  elders TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**liturgy_items**
```sql
CREATE TABLE liturgy_items (
  id TEXT PRIMARY KEY,
  liturgy_id TEXT NOT NULL,
  type TEXT NOT NULL, -- OPENING, PRAYER, MUSIC, etc.
  title TEXT NOT NULL,
  description TEXT,
  start_time TEXT,
  duration INTEGER,
  responsible TEXT,
  youtube_url TEXT,
  music_key TEXT,
  notes TEXT,
  order INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT 0,
  completed_at DATETIME,
  tags TEXT, -- JSON array
  metadata TEXT, -- JSON object
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (liturgy_id) REFERENCES liturgies(id)
);
```

**settings**
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL, -- JSON value
  category TEXT, -- ai, youtube, general, stream
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**youtube_downloads**
```sql
CREATE TABLE youtube_downloads (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  thumbnail TEXT,
  duration INTEGER,
  file_path TEXT,
  status TEXT, -- pending, downloading, completed, failed
  progress REAL,
  error TEXT,
  metadata TEXT, -- JSON object
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);
```

---

## API Endpoints Summary

### Liturgy Endpoints
```
GET    /api/liturgy           - List all liturgies
GET    /api/liturgy/:id       - Get liturgy by ID
POST   /api/liturgy           - Create liturgy
PUT    /api/liturgy/:id       - Update liturgy
DELETE /api/liturgy/:id       - Delete liturgy
POST   /api/liturgy/analyze   - AI analysis
```

### YouTube Endpoints
```
POST   /api/youtube/download  - Queue download
GET    /api/youtube/progress  - Get download progress
GET    /api/youtube/queue     - Get download queue
DELETE /api/youtube/cancel    - Cancel download
POST   /api/youtube/delete    - Delete downloaded file
POST   /api/youtube/info      - Get video info
```

### AI Endpoints
```
GET    /api/ai/models         - List available models
POST   /api/ai/analyze        - Analyze text
GET    /api/ai/test           - Test connection
```

### System Endpoints
```
GET    /api/health            - Health check
POST   /api/logs              - Client logging
POST   /api/configuration     - Save configuration
POST   /api/system/open-file  - Open file in system
```

---

## Key UI Patterns

### Component Structure
```
components/
├── liturgy/           # Liturgy management
│   ├── EditLiturgyItemModal.vue
│   └── LiturgyTimeline.vue
├── youtube/           # YouTube integration
│   ├── YouTubeModal.vue
│   └── YouTubeProgressPanel.vue
├── settings/          # Settings
│   └── SettingsModal.vue
├── templates/         # Template system
│   ├── TemplateModal.vue
│   ├── ImportExportModal.vue
│   └── BulkOperationsModal.vue
└── help/              # Help system
    └── ShortcutsModal.vue
```

### Composables (Vue Hooks)
```typescript
// State Management
useSettings()          // Settings CRUD
useLiturgy()           // Liturgy state
useYouTube()           // YouTube downloads

// Features
useAILiturgy()         // AI analysis
useWebSocket()         // Real-time sync
useLogger()            // Logging

// Utilities
useTimer()             // Timer management
useKeyboard()          // Keyboard shortcuts
useModal()             // Modal state
```

---

## Migration to NX + NestJS

### Step-by-Step Migration Plan

#### Phase 1: Setup (Week 1)
1. **Initialize NX workspace**
   ```bash
   npx create-nx-workspace@latest church-liturgy-nx
   ```

2. **Add Nuxt applications**
   ```bash
   nx g @nx/nuxt:app frontend-main
   nx g @nx/nuxt:app frontend-stream
   nx g @nx/nuxt:app frontend-unified
   ```

3. **Add NestJS backend**
   ```bash
   nx g @nx/nest:app backend
   ```

4. **Create shared libraries**
   ```bash
   nx g @nx/js:lib shared-types
   nx g @nx/js:lib database
   nx g @nx/js:lib ai-service
   nx g @nx/js:lib youtube-service
   ```

#### Phase 2: Backend (Week 2-3)
1. **Setup Prisma**
   - Install Prisma
   - Define schema (based on current SQLite)
   - Generate client
   - Create migrations

2. **Implement NestJS modules**
   - LiturgyModule (CRUD operations)
   - YouTubeModule (download management)
   - AIModule (Ollama integration)
   - WebSocketGateway (real-time sync)

3. **Add authentication** (if needed)
   - JWT strategy
   - Guards and decorators

#### Phase 3: Frontend (Week 4-5)
1. **Migrate UI components**
   - Copy Vue components
   - Update import paths
   - Integrate with new API

2. **Update API calls**
   - Replace Nuxt server routes with NestJS endpoints
   - Use Axios or Fetch
   - Add error handling

3. **Implement state management**
   - Pinia stores
   - WebSocket listeners
   - Optimistic updates

#### Phase 4: Electron (Week 5)
1. **Setup Electron in NX**
   ```bash
   nx g @nx/electron:app desktop
   ```

2. **Configure multi-window**
   - Main window (Main Space)
   - Stream window (Stream Space)
   - IPC channels

3. **Package for distribution**
   - Windows (NSIS installer)
   - macOS (DMG)
   - Linux (AppImage)

#### Phase 5: Testing & Polish (Week 6)
1. **Unit tests**
   - Jest for backend
   - Vitest for frontend

2. **E2E tests**
   - Playwright or Cypress

3. **Documentation**
   - API documentation (Swagger)
   - User guide
   - Developer guide

---

## Key Improvements with NX Migration

### Developer Experience
✅ **Faster Builds**: NX computation caching  
✅ **Better Tooling**: NX Console, Dependency Graph  
✅ **Type Safety**: Shared types across frontend/backend  
✅ **Consistency**: Enforced architecture boundaries  
✅ **Scalability**: Easier to add new apps/libs  

### Architecture Benefits
✅ **Separation of Concerns**: Clear backend/frontend split  
✅ **API-First**: RESTful API with optional GraphQL  
✅ **Testing**: Built-in testing infrastructure  
✅ **Documentation**: Auto-generated API docs  
✅ **CI/CD**: Optimized build pipelines  

### Code Quality
✅ **Linting**: Consistent code style  
✅ **Type Checking**: Stricter TypeScript  
✅ **Test Coverage**: Enforced coverage thresholds  
✅ **Code Generation**: NX generators for boilerplate  
✅ **Dependency Management**: Better vulnerability scanning  

---

## Critical Considerations

### Security
- **API Keys**: Environment variables, never in code
- **Database**: Encrypt sensitive data
- **Electron**: Context isolation, secure IPC
- **API**: Rate limiting, input validation

### Performance
- **Database**: Indexes on foreign keys, date fields
- **API**: Response caching, pagination
- **Frontend**: Lazy loading, code splitting
- **Electron**: Memory management, process isolation

### Offline Support
- **Database**: Local-first architecture
- **AI**: Local Ollama (optional cloud fallback)
- **Cache**: Service worker for assets
- **Sync**: Queue operations when offline

### Cross-Platform
- **Paths**: Use path.join, avoid hardcoded paths
- **Commands**: Check platform before exec
- **UI**: Test on all target platforms
- **Shortcuts**: Platform-specific keybindings

---

## Resources & Documentation

### Primary Documentation
- **Main Project Docs**: `docs/COMPREHENSIVE-PROJECT-DOCUMENTATION.md`
- **UI Features**: `docs/UI-FEATURES-GUIDE.md`
- **Development Guide**: `docs/DEVELOPMENT.md`
- **Changelog**: `docs/CHANGELOG.md`

### External Resources
- **NX**: https://nx.dev
- **NestJS**: https://nestjs.com
- **Nuxt 3**: https://nuxt.com
- **Electron**: https://electronjs.org
- **Prisma**: https://prisma.io
- **Ollama**: https://ollama.ai

### Example Code Snippets
See the actual implementation in:
- `apps/main-space/pages/index.vue` - Main UI
- `apps/main-space/server/api/` - API endpoints
- `packages/ai-service/` - AI integration
- `packages/youtube-service/` - YouTube service
- `electron/main/index.ts` - Electron setup

---

## Success Metrics

### Development Metrics
- [ ] All 3 frontend apps running
- [ ] Backend API responding
- [ ] Database schema created
- [ ] Electron app packaging
- [ ] Tests passing (>80% coverage)

### Feature Metrics
- [ ] AI liturgy analysis working
- [ ] YouTube downloads functional
- [ ] Real-time control operational
- [ ] Settings persisting
- [ ] Multi-window communication

### Quality Metrics
- [ ] TypeScript strict mode
- [ ] ESLint no errors
- [ ] Lighthouse score >90
- [ ] Bundle size optimized
- [ ] Documentation complete

---

## Quick Start Commands

### Development
```bash
# Start all services
nx run-many --target=serve --all

# Or individually
nx serve frontend-main
nx serve frontend-stream  
nx serve backend

# Run tests
nx run-many --target=test --all

# Build for production
nx run-many --target=build --all
```

### Useful NX Commands
```bash
# Dependency graph
nx graph

# Affected by changes
nx affected:build
nx affected:test

# Generate new module
nx g @nx/nest:module my-module

# Run migration
nx migrate latest
```

---

## Conclusion

The Church Liturgy Copilot demonstrates a well-architected desktop application with modern web technologies. Migrating to NX + NestJS provides better tooling, clearer architecture, and improved scalability while maintaining the core functionality and user experience.

This summary provides the essential information needed to replicate or migrate the project. For detailed implementation, refer to the comprehensive documentation and actual source code.

---

**Document Version**: 1.0  
**Last Updated**: October 31, 2025  
**Author**: Project Analysis  
**Target Audience**: Development teams planning similar projects
