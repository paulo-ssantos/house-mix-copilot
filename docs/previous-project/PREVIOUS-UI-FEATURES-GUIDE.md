# Church Liturgy Copilot - UI Features & Components Guide

## Overview
* IMPORTANT: This documentation corresponds to the previous and deprecated implementation of the Church Liturgy Copilot project, which utilized Nuxt 3, Electron, NestJS, and SQLite. Careful consideration should be given before using this as a reference for new projects, as the architecture and technologies may have evolved in subsequent versions. This must be used primarily for base UI and feature reference only, but always cross-check and critically think in the relevance of the information in the context of current best practices and technologies.

This document provides a detailed guide to all UI features and components in the Church Liturgy Copilot application, focusing on user interactions, visual design, and functionality.

---

## Table of Contents

1. [Main Application Layout](#main-application-layout)
2. [Core Features](#core-features)
3. [Component Catalog](#component-catalog)
4. [User Workflows](#user-workflows)
5. [Keyboard Shortcuts](#keyboard-shortcuts)
6. [Visual Design System](#visual-design-system)

---

## Main Application Layout

### Navigation Bar

**Location**: Top of the application

**Components**:
- **Application Title**: "Church Liturgy Copilot - Main Space"
- **Version Badge**: Displays current version (v1.0.0)
- **Connection Status Badge**: Shows connection to services (Connected/Disconnected)
- **Theme Toggle Button**: Switch between light and dark modes
- **Settings Button**: Opens settings modal

**Visual States**:
- Connected: Green badge
- Disconnected: Red badge
- Theme icon changes: Sun (light mode) / Moon (dark mode)

---

## Core Features

### 1. AI-Powered Liturgy Analysis

**Description**: The centerpiece feature that automatically analyzes raw liturgy text and creates structured, organized liturgy items.

**UI Location**: Main content area, left panel

**Visual Components**:

#### Input Section
- **Title Field**: Text input for liturgy title
  - Placeholder: "Sunday Service - December 15, 2024"
  - Full width
  
- **Date Field**: Date picker
  - Default: Current date
  - Calendar popup for selection
  
- **Church Field**: Text input
  - Placeholder: "First Baptist Church"
  
- **Elders/Anchors Field**: Text input
  - Placeholder: "John, Mary, Peter (comma separated)"
  
- **Raw Liturgy Text**: Large textarea (8 rows)
  - Placeholder: "Paste your liturgy script here... The AI will analyze and structure it automatically."
  - Monospace font for better readability
  - Syntax highlighting (optional)

#### Action Button
- **"Analyze with AI" Button**:
  - Primary blue color
  - Sparkles icon (✨)
  - Loading spinner when processing
  - Disabled when textarea is empty
  - Success animation on completion

**User Flow**:
1. User pastes liturgy text
2. Fills in optional metadata (title, date, etc.)
3. Clicks "Analyze with AI"
4. Loading state shows with spinner
5. Progress indicators appear
6. Success notification with results summary:
   - Number of items created
   - YouTube links found
   - Downloads started
   - Any suggestions

**Results Display**:
- Timeline view updates automatically
- YouTube videos queued for download
- Success toast notification
- Metrics shown (processing time, items created)

**Error Handling**:
- Red error notification if AI fails
- Fallback to manual entry
- Helpful error messages
- Option to retry

---

### 2. Liturgy Timeline Management

**Description**: Interactive, drag-and-drop timeline of all liturgy items with visual indicators.

**UI Location**: Main content area, left panel (below input)

**Visual Design**:

#### Timeline Header
- **Title**: "Liturgy Items"
- **Add Item Button**: Green button with plus icon
- **Start Liturgy Button**: Green play button
  - Disabled if no items exist
  - Tooltip: "Start Liturgy"

#### Item Cards
Each liturgy item is displayed as a card with:

**Layout**:
```
┌─────────────────────────────────────────────────┐
│ 🎯 [Badge] Item Title              [Time]  ⋮  │
│                                                 │
│ Description text here...                        │
│                                                 │
│ Responsible: John | Key: G                      │
│ [▶️ YouTube] [✏️ Edit] [🗑️ Delete]              │
└─────────────────────────────────────────────────┘
```

**Visual Elements**:

1. **Drag Handle**: Six dots icon on the left
   - Appears on hover
   - Cursor changes to move
   - Gray color, darkens on hover

2. **Type Badge**: Color-coded by liturgy item type
   - **OPENING**: Blue
   - **PRAYER**: Purple
   - **MUSIC**: Green
   - **SPECIAL_MUSIC**: Emerald
   - **READING**: Indigo
   - **MESSAGE**: Orange
   - **OFFERING**: Yellow
   - **ANNOUNCEMENT**: Gray
   - **MOMENT**: Pink
   - **CLOSING**: Red
   - **BREAK**: Slate
   - **OTHER**: Neutral

3. **Title**: Bold, prominent text
   - Font size: 16px
   - Color: Dark gray (light mode) / White (dark mode)

4. **Start Time**: Small gray text next to title
   - Format: "HH:MM" (24-hour)
   - Example: "09:30"

5. **Description**: Secondary text below title
   - Font size: 14px
   - Color: Gray
   - Truncated if too long

6. **Metadata Row**: Small text below description
   - **Responsible**: Person's name
   - **Music Key**: Musical key (if applicable)
   - Separated by pipes (|)

7. **Action Buttons**:
   - **YouTube Icon**: Red if video URL exists
   - **Edit Icon**: Pencil, opens edit modal
   - **Delete Icon**: Trash, red color

**Interactive States**:

- **Normal**: White background, light border
- **Hover**: Subtle shadow, border darkens
- **Active** (currently playing): Blue border, light blue background
- **Completed**: Green background, checkmark icon
- **Dragging**: Rotated slightly, increased shadow
- **Ghost** (drop target): Semi-transparent, dashed border
- **Chosen** (being dragged): Scaled up 2%, blue border

**Drag and Drop**:
- Smooth animations (200ms)
- Visual feedback when dragging
- Auto-scroll when near edges
- Drop zones highlighted
- Reorder updates immediately

**Empty State**:
```
┌─────────────────────────────────────────────────┐
│                                                 │
│                      📋                         │
│                                                 │
│    No liturgy items yet. Add some items or     │
│    analyze your liturgy text with AI.          │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### 3. Real-Time Control Panel

**Description**: Live control panel for managing worship service execution.

**UI Location**: Right sidebar, top card

**Layout**:
```
┌─────────────────────────┐
│  Liturgy Control        │
├─────────────────────────┤
│                         │
│      ⏱️ 00:15:32         │
│   Item 3 of 12          │
│                         │
│  [▶️ Start] [⏸️ Pause]   │
│  [⏮️ Prev]  [⏭️ Next]    │
│                         │
└─────────────────────────┘
```

**Components**:

#### Timer Display
- **Large centered numbers**: "00:15:32" format (HH:MM:SS)
- **Color**: Blue (primary)
- **Font**: Monospace, bold
- **Size**: 32px
- **Updates**: Every second

#### Progress Indicator
- "Item X of Y" text
- Small, gray color
- Below timer

#### Control Buttons

**Before Starting**:
- **Start Button**: Green, play icon
  - Full width
  - Prominent
  - Disabled if no items

**While Running**:
- **Pause Button**: Yellow, pause icon
  - Changes to "Resume" (green, play icon) when paused
  
- **Stop Button**: Red, stop icon
  - Confirmation dialog before stopping

- **Previous Button**: Gray, backward icon
  - Disabled on first item
  - Half width (left)

- **Next Button**: Gray, forward icon
  - Disabled on last item
  - Half width (right)

**Keyboard Shortcuts**:
- **Space**: Toggle play/pause
- **Shift + ↑**: Previous item
- **Shift + ↓**: Next item

---

### 4. Current Item Display

**Description**: Shows details of the currently active liturgy item.

**UI Location**: Right sidebar, middle card

**Visible Only When**: Liturgy is active

**Layout**:
```
┌─────────────────────────┐
│  Current Item           │
├─────────────────────────┤
│                         │
│  [MUSIC]                │
│  Amazing Grace          │
│                         │
│  Traditional hymn,      │
│  congregation singing   │
│                         │
│  📝 Notes:              │
│  Start with piano only  │
│                         │
└─────────────────────────┘
```

**Components**:
- **Type Badge**: Same styling as timeline
- **Title**: Large, bold (20px)
- **Description**: Regular text, gray
- **Notes Section**: Yellow highlighted box
  - Only shown if notes exist
  - Icon: 📝
  - Pale yellow background
  - Border: Yellow

---

### 5. YouTube Integration

**Description**: Comprehensive YouTube video management with download progress tracking.

#### YouTube Modal

**Triggered By**:
- Clicking YouTube icon on liturgy item
- Pressing Ctrl+Y
- YouTube link detected in analysis

**Layout**:
```
┌─────────────────────────────────────┐
│  YouTube Video Download             │
├─────────────────────────────────────┤
│                                     │
│  URL: [________________________]    │
│       [Paste Link] [Get Info]      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  [Thumbnail]                │   │
│  │                             │   │
│  │  Video Title                │   │
│  │  Duration: 3:45             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Quality: [1080p ▼]                │
│  Format:  [MP4 ▼]                  │
│                                     │
│  [Cancel] [Download]                │
│                                     │
└─────────────────────────────────────┘
```

**Features**:
- URL validation
- Video preview
- Quality selection (2160p, 1080p, 720p, 480p, 360p)
- Format selection (MP4, WEBM, MKV)
- Download button (primary blue)
- Cancel button (gray)

#### YouTube Progress Panel

**Location**: Right sidebar, bottom card

**Layout**:
```
┌─────────────────────────┐
│  YouTube Downloads      │
├─────────────────────────┤
│                         │
│  Amazing Grace          │
│  [████████░░] 85%       │
│  2.5 MB/s | 3s left     │
│                         │
│  ────────────────       │
│                         │
│  Completed (3)          │
│  • Video 1              │
│  • Video 2              │
│  • Video 3              │
│                         │
│  [Clear Completed]      │
│                         │
└─────────────────────────┘
```

**Active Downloads**:
- Video title
- Progress bar (blue)
- Percentage
- Download speed
- Time remaining (ETA)
- Cancel button (X icon)

**Completed Downloads**:
- Collapsible list
- Video titles
- Open file button
- Delete button
- Bulk delete button

**Empty State**:
```
No downloads in progress
```

---

### 6. Template System

**Description**: Save and reuse common liturgy patterns.

#### Template Modal

**Triggered By**: 
- Ctrl+T
- F2
- Template button in toolbar

**Layout**:
```
┌─────────────────────────────────────┐
│  Liturgy Templates                  │
├─────────────────────────────────────┤
│  Search: [________________] 🔍      │
│                                     │
│  ┌───────────────┐ ┌──────────────┐│
│  │ Sunday        │ │ Midweek      ││
│  │ Service       │ │ Service      ││
│  │               │ │              ││
│  │ 15 items      │ │ 8 items      ││
│  │ [Load]        │ │ [Load]       ││
│  └───────────────┘ └──────────────┘│
│                                     │
│  [+ Create New Template]            │
│                                     │
└─────────────────────────────────────┘
```

**Template Cards**:
- Template name
- Item count
- Last used date
- Preview on hover
- Load button (green)
- Delete button (red, icon only)

**Create Template Dialog**:
- Name input
- Description (optional)
- Save current liturgy as template

---

### 7. Settings Modal

**Description**: Comprehensive application configuration.

**Triggered By**:
- Settings button in navbar
- Ctrl+,

**Layout**: Tabbed interface

#### Tabs:
1. **AI Settings** 🤖
2. **YouTube Settings** 📺
3. **General Settings** ⚙️
4. **Stream Settings** 📡
5. **Advanced** 🔧

#### AI Settings Tab

```
┌─────────────────────────────────────┐
│  [AI] [YouTube] [General] [Stream]  │
├─────────────────────────────────────┤
│                                     │
│  🔌 Connection                      │
│                                     │
│  Ollama URL:                        │
│  [http://localhost:11434]           │
│                                     │
│  Primary Model:                     │
│  [llama2 ▼]           [Test]        │
│                                     │
│  Fallback Model:                    │
│  [gemma ▼]                          │
│                                     │
│  ⚙️ Generation Settings              │
│                                     │
│  Temperature: [0.7]                 │
│  Max Tokens: [2000]                 │
│                                     │
│                    [Reset] [Save]   │
│                                     │
└─────────────────────────────────────┘
```

**Features**:
- Form validation
- Test connection button
- Reset to defaults
- Save button (primary)
- Unsaved changes warning
- Connection status indicator

#### YouTube Settings Tab

```
┌─────────────────────────────────────┐
│  📺 Download Settings                │
│                                     │
│  Default Quality:                   │
│  [1080p ▼]                          │
│                                     │
│  Preferred Format:                  │
│  [MP4 ▼]                            │
│                                     │
│  Download Directory:                │
│  [/path/to/downloads] [Browse...]   │
│                                     │
│  [✓] Auto-download on analysis      │
│  [✓] Show progress notifications    │
│                                     │
│  Max Concurrent Downloads:          │
│  [3]                                │
│                                     │
│                    [Reset] [Save]   │
│                                     │
└─────────────────────────────────────┘
```

---

### 8. Keyboard Shortcuts Reference

**Description**: Interactive reference for all keyboard shortcuts.

**Triggered By**:
- F1
- Help button
- "?" key

**Layout**: Categorized list with search

```
┌─────────────────────────────────────┐
│  Keyboard Shortcuts                 │
├─────────────────────────────────────┤
│  Search: [________________] 🔍      │
│                                     │
│  📝 General                          │
│  Ctrl + T      Templates            │
│  Ctrl + I      Import/Export        │
│  Ctrl + S      Save                 │
│  Ctrl + ,      Settings             │
│  F1            Help                 │
│                                     │
│  ⏯️ Liturgy Control                  │
│  Space         Play/Pause           │
│  Shift + ↑     Previous Item        │
│  Shift + ↓     Next Item            │
│                                     │
│  🎥 YouTube                          │
│  Ctrl + Y      YouTube Modal        │
│                                     │
└─────────────────────────────────────┘
```

**Features**:
- Search filter
- Category grouping
- Visual key representations
- Platform-specific (Ctrl vs Cmd)
- Printable view option

---

## Component Catalog

### Buttons

#### Primary Button
- **Color**: Blue (#3B82F6)
- **States**: Normal, Hover, Active, Disabled, Loading
- **Sizes**: XS, SM, MD, LG
- **Icons**: Optional leading/trailing icons
- **Examples**: "Save", "Analyze with AI", "Download"

#### Secondary Button
- **Color**: Gray
- **Variants**: Ghost (transparent), Soft (light bg)
- **Use**: Secondary actions, cancel buttons

#### Danger Button
- **Color**: Red (#EF4444)
- **Use**: Delete, Stop, Destructive actions
- **Confirmation**: Usually requires confirmation

### Inputs

#### Text Input
- **Border**: Gray, blue on focus
- **Placeholder**: Light gray text
- **Validation**: Red border on error
- **Icons**: Optional leading/trailing icons
- **Help Text**: Below input (gray)

#### Textarea
- **Rows**: Configurable (default: 3)
- **Resize**: Vertical only
- **Auto-height**: Optional
- **Character count**: Optional

#### Select Dropdown
- **Options**: List of choices
- **Search**: Optional filtering
- **Multi-select**: Checkbox variant
- **Custom rendering**: With icons/badges

### Cards

#### Standard Card
- **Header**: Title, optional actions
- **Body**: Main content
- **Footer**: Optional actions
- **Shadow**: Subtle shadow on hover
- **Padding**: Consistent 16px

#### Modal Card
- **Overlay**: Semi-transparent black
- **Position**: Centered
- **Max Width**: Configurable
- **Close**: X button, Escape key, click outside

### Badges

**Color Variants**:
- Blue (info)
- Green (success)
- Yellow (warning)
- Red (error)
- Gray (neutral)
- Purple (special)

**Sizes**: XS, SM, MD

**Variants**:
- Solid (colored background)
- Soft (light background)
- Outline (border only)

### Progress Bars

- **Height**: 8px or 16px (detailed)
- **Colors**: Blue (default), Green (success), Red (error)
- **Animation**: Smooth transitions
- **Labels**: Percentage, text status

---

## User Workflows

### Workflow 1: Creating a New Liturgy from Text

1. **Open Application**
   - See empty timeline
   - Input section ready

2. **Paste Liturgy Text**
   - Copy text from document
   - Paste into "Raw Liturgy Text" area
   - Text appears with formatting

3. **Fill Metadata** (Optional)
   - Enter title
   - Select date
   - Enter church name
   - List elders

4. **Analyze with AI**
   - Click "Analyze with AI" button
   - Button shows spinner
   - Wait 3-10 seconds

5. **Review Results**
   - See success notification
   - Timeline populates with items
   - YouTube downloads start automatically
   - Review item details

6. **Edit if Needed**
   - Click edit icon on any item
   - Modify title, description, time, etc.
   - Save changes

7. **Save Liturgy**
   - Ctrl+S or auto-save
   - Confirmation toast

### Workflow 2: Running a Live Liturgy

1. **Load Liturgy**
   - From saved liturgies
   - Or create new one

2. **Review Timeline**
   - Check all items are correct
   - Verify times and responsibilities
   - Make last-minute edits

3. **Start Liturgy**
   - Click "Start Liturgy" button
   - Timer begins
   - First item highlights

4. **During Service**
   - Monitor current item display
   - Use Next/Previous buttons as needed
   - Pause if necessary
   - Mark items complete automatically

5. **Complete Service**
   - Navigate through all items
   - Click "Stop" when finished
   - Review completion log

### Workflow 3: Downloading YouTube Videos

1. **Detect or Enter URL**
   - AI finds URL in text (automatic)
   - Or manually open YouTube modal (Ctrl+Y)

2. **Preview Video**
   - See thumbnail and title
   - Check duration
   - Verify correct video

3. **Select Quality**
   - Choose from dropdown (1080p, 720p, etc.)
   - Select format (MP4 recommended)

4. **Download**
   - Click "Download" button
   - Modal closes
   - Progress appears in sidebar

5. **Monitor Progress**
   - Watch progress bar
   - See download speed and ETA
   - Can cancel if needed

6. **Use Downloaded Video**
   - Click to open file
   - Or use in liturgy item
   - Available offline

---

## Visual Design System

### Color Palette

#### Light Mode
- **Background**: White (#FFFFFF), Light Gray (#F9FAFB)
- **Text**: Dark Gray (#111827), Medium Gray (#6B7280)
- **Borders**: Light Gray (#E5E7EB)
- **Primary**: Blue (#3B82F6)
- **Success**: Green (#22C55E)
- **Warning**: Orange (#F59E0B)
- **Error**: Red (#EF4444)

#### Dark Mode
- **Background**: Dark Gray (#111827), Darker Gray (#1F2937)
- **Text**: White (#F9FAFB), Light Gray (#D1D5DB)
- **Borders**: Medium Gray (#374151)
- **Primary**: Light Blue (#60A5FA)
- **Success**: Light Green (#4ADE80)
- **Warning**: Light Orange (#FCD34D)
- **Error**: Light Red (#F87171)

### Typography

**Font Stack**:
```
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
```

**Sizes**:
- **Heading 1**: 32px, Bold
- **Heading 2**: 24px, Semibold
- **Heading 3**: 20px, Semibold
- **Heading 4**: 18px, Medium
- **Body**: 16px, Regular
- **Small**: 14px, Regular
- **Tiny**: 12px, Regular

**Line Heights**:
- **Headings**: 1.2
- **Body**: 1.5
- **Code**: 1.6

### Spacing

**Base Unit**: 4px (0.25rem)

**Scale**:
- 1x: 4px
- 2x: 8px
- 3x: 12px
- 4x: 16px
- 5x: 20px
- 6x: 24px
- 8x: 32px
- 12x: 48px
- 16x: 64px

**Common Uses**:
- **Padding (cards)**: 16px (4x)
- **Gap (grid)**: 24px (6x)
- **Margin (sections)**: 32px (8x)
- **Button padding**: 12px 24px (3x 6x)

### Shadows

**Levels**:
```css
/* Level 1 - Subtle */
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* Level 2 - Card */
box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 
            0 1px 2px 0 rgba(0, 0, 0, 0.06);

/* Level 3 - Modal */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
            0 4px 6px -2px rgba(0, 0, 0, 0.05);

/* Level 4 - Overlay */
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

### Animations

**Durations**:
- **Fast**: 150ms (hover, focus)
- **Normal**: 200ms (drag-drop, transitions)
- **Slow**: 300ms (modals, page transitions)

**Easings**:
```css
/* Default */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

/* Ease Out */
transition-timing-function: cubic-bezier(0, 0, 0.2, 1);

/* Bounce */
transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 639px) { }

/* Tablet */
@media (min-width: 640px) and (max-width: 1023px) { }

/* Desktop */
@media (min-width: 1024px) { }

/* Large Desktop */
@media (min-width: 1280px) { }
```

---

## Accessibility

### Keyboard Navigation
- All interactive elements focusable
- Focus indicators visible
- Tab order logical
- Escape closes modals
- Arrow keys for lists

### Screen Readers
- Semantic HTML
- ARIA labels where needed
- Alt text for images
- Status announcements
- Error messages announced

### Contrast
- WCAG AA compliant
- 4.5:1 minimum for text
- 3:1 for large text
- Focus indicators clear

---

## Conclusion

The Church Liturgy Copilot provides a comprehensive, polished UI experience with attention to detail, accessibility, and user workflows. All components follow consistent design patterns, making the application intuitive and professional.

For technical implementation details, refer to the main project documentation.

---

**Document Version**: 1.0  
**Last Updated**: October 31, 2025  
**For**: Church Liturgy Copilot v9

* IMPORTANT: This documentation corresponds to the previous and deprecated implementation of the Church Liturgy Copilot project, which utilized Nuxt 3, Electron, NestJS, and SQLite. Careful consideration should be given before using this as a reference for new projects, as the architecture and technologies may have evolved in subsequent versions. This must be used primarily for base UI and feature reference only, but always cross-check and critically think in the relevance of the information in the context of current best practices and technologies.