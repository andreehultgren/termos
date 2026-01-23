# Termos - App Structure

Terminal application built with Tauri (Rust backend) and xterm.js (frontend).

## How to build

When asked to develop something new, build tests first. When building the functionality, evaluate each step against the tests to verify a successful build.

- Each function should have one purpose and responsibility
- Do not overcomplicate solutions. Less complex is often better
- Keep the folder structure neat, organized and documented with CLAUDE.md files
- Reuse code where possible, so we have a single source of truth at all times.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Tauri Window                         │
├───────────┬─────┬───────────────────────────────────────────┤
│  Sidebar  │  D  │            Terminal Container             │
│           │  i  │  ┌─────────────────────────────────────┐  │
│  Commands │  v  │  │  Tab Bar  [Tab 1][Tab 2][+]         │  │
│  [Button] │  i  │  ├─────────────────────────────────────┤  │
│  [Button] │  d  │  │                                     │  │
│           │  e  │  │         xterm.js Terminal           │  │
│  [+ Add]  │  r  │  │                                     │  │
│           │     │  │                                     │  │
└───────────┴─────┴──┴─────────────────────────────────────┴──┘
```

## Directory Structure

```
termos/
├── src/                      # Frontend React + TypeScript
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Main app component, state management
│   ├── style.css             # Global styles
│   ├── components/
│   │   ├── Sidebar.tsx       # Command buttons sidebar
│   │   ├── TabBar.tsx        # Tab bar with tab list
│   │   ├── Terminal.tsx      # xterm.js wrapper component
│   │   ├── Modal.tsx         # Add/edit command modal
│   │   ├── ContextMenu.tsx   # Right-click context menu
│   │   └── Divider.tsx       # Resizable divider
│   └── hooks/
│       └── useLocalStorage.ts # localStorage hook
├── src-tauri/                # Tauri backend (if using tauri-app structure)
│   └── src/
│       ├── main.rs           # PTY management, tab lifecycle
│       └── lib.rs            # Data structures
├── index.html                # HTML entry point (root for Vite)
├── dist/                     # Vite build output (generated)
├── package.json              # Node dependencies (React, Vite, xterm)
├── vite.config.ts            # Vite + React configuration
├── tsconfig.json             # TypeScript configuration
├── Cargo.toml                # Rust dependencies
└── tauri.conf.json           # Tauri configuration
```

## Key Components

### Backend (Rust - `src/main.rs`)

- **TabsState**: Manages multiple PTY instances in a HashMap
- **spawn_tab()**: Creates a new PTY with shell, sets up I/O threads
- **Commands**:
  - `create_tab` - Creates new terminal tab, returns tab ID
  - `close_tab` - Closes tab by ID
  - `send_to_tab` - Sends input data to specific tab's PTY
- **Events**:
  - `terminal-data` - Emits PTY output with `{tab_id, data}`
  - `tab-closed` - Emits when PTY process exits

### Frontend (React + TypeScript - `src/`)

Built with Vite + React. Run `npm run dev` for HMR dev server.

- **App.tsx**: Main component, manages tabs state and Tauri event listeners
- **components/**:
  - `Sidebar.tsx` - Command buttons with add/edit/delete
  - `TabBar.tsx` - Tab list and new tab button
  - `Terminal.tsx` - xterm.js wrapper with imperative handle
  - `Modal.tsx` - Add/edit command dialog
  - `ContextMenu.tsx` - Right-click menu
  - `Divider.tsx` - Resizable sidebar divider
- **hooks/**:
  - `useLocalStorage.ts` - Persisted state hook
- **Keyboard Shortcuts** (in App.tsx):
  - Cmd/Ctrl+T - New tab
  - Cmd/Ctrl+W - Close tab
  - Escape - Close modal/context menu

## Data Flow

```
User Input (keyboard)
    ↓
xterm.onData → invoke("send_to_tab", {tabId, data})
    ↓
Rust: write to PTY writer
    ↓
PTY shell executes

PTY output
    ↓
Rust reader thread → emit("terminal-data", {tab_id, data})
    ↓
JS listen → tabs.get(tab_id).term.write(data)
```

## Build & Run

```bash
npm install        # Install frontend dependencies (first time)
npm run dev        # Start Vite dev server only (for frontend work)
cargo tauri dev    # Development (starts Vite + Tauri)
cargo tauri build  # Production build
```

## Storage

- `localStorage["termos-buttons"]` - Command buttons JSON
- `localStorage["termos-sidebar-width"]` - Sidebar width
