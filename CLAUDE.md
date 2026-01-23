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
├── src/
│   ├── main.rs          # Tauri backend - PTY management, tab lifecycle
│   └── lib.rs           # Data structures (CommandButton, AppState)
├── dist/
│   ├── index.html       # HTML structure
│   ├── renderer.js      # Frontend logic - tabs, buttons, terminal
│   └── style.css        # Styling
├── Cargo.toml           # Rust dependencies
└── tauri.conf.json      # Tauri configuration
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

### Frontend (JavaScript - `dist/renderer.js`)

- **Tab Management**:
  - `tabs` Map: tabId -> {term, fitAddon, element}
  - `createTab()` / `closeTab()` - Tab lifecycle
  - `switchToTab()` - Tab switching logic
- **Keyboard Shortcuts**:
  - Cmd/Ctrl+T - New tab
  - Cmd/Ctrl+W - Close tab
- **Sidebar Buttons**: Stored in localStorage (`termos-buttons`)

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
cargo tauri dev    # Development
cargo tauri build  # Production build
```

## Storage

- `localStorage["termos-buttons"]` - Command buttons JSON
- `localStorage["termos-sidebar-width"]` - Sidebar width
