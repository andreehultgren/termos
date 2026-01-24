# Termos - App Structure

Terminal application built with Tauri (Rust backend) and React + xterm.js (frontend).

## Development Guidelines

- Build tests first when developing new features
- Each function should have one purpose and responsibility
- Keep solutions simple - less complex is often better
- Maintain organized folder structure with CLAUDE.md files
- Reuse code where possible for single source of truth

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
├── src/                          # Frontend React + TypeScript
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Main app component, state management
│   ├── style.css                 # Global styles
│   │
│   ├── components/               # Reusable styled-components (primitives)
│   │   ├── index.tsx             # Barrel exports
│   │   ├── Button.tsx            # Button variants (command, closeTab, newTab)
│   │   ├── FormGroup.tsx         # Form container
│   │   ├── FormInput.tsx         # Styled input
│   │   ├── FormLabel.tsx         # Styled label
│   │   ├── ModalOverlay.tsx      # Modal backdrop
│   │   ├── ModalContainer.tsx    # Modal content wrapper
│   │   ├── ModalActions.tsx      # Modal button row
│   │   ├── ContextMenuContainer.tsx
│   │   ├── ContextMenuItem.tsx
│   │   ├── TabBarContainer.tsx   # Tab bar wrapper
│   │   ├── TabContainer.tsx      # Individual tab
│   │   ├── TabTitle.tsx          # Tab text
│   │   ├── TerminalContainer.tsx # Terminal area wrapper
│   │   ├── TerminalInstance.tsx  # xterm instance wrapper
│   │   └── InfoText.tsx          # Helper text
│   │
│   ├── views/                    # Composite components (features)
│   │   ├── index.tsx             # Barrel exports
│   │   ├── TabBar.tsx            # Tab bar with tabs and new button
│   │   ├── Terminal.tsx          # xterm.js wrapper with imperative handle
│   │   ├── Modal.tsx             # Add/edit command modal
│   │   ├── CommandParameterModal.tsx  # Parameter input modal
│   │   ├── ContextMenu.tsx       # Right-click menu
│   │   └── Divider.tsx           # Resizable sidebar divider
│   │
│   ├── layouts/                  # Layout components
│   │   └── Sidebar.tsx           # Command buttons sidebar
│   │
│   ├── hooks/                    # Custom React hooks
│   │   └── useLocalStorage.ts    # Persisted state hook
│   │
│   └── utils/                    # Utility functions
│       └── commandTemplate.ts    # Template variable parsing {{var}}
│
├── src-tauri/                    # Tauri backend
│   └── src/
│       ├── main.rs               # PTY management, tab lifecycle
│       └── lib.rs                # Data structures
│
├── index.html                    # HTML entry point
├── package.json                  # Node dependencies
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
├── Cargo.toml                    # Rust dependencies
└── tauri.conf.json               # Tauri configuration
```

## Key Components

### Backend (Rust - `src-tauri/src/main.rs`)

- **TabsState**: Manages multiple PTY instances in a HashMap
- **Commands**:
  - `create_tab` - Creates new terminal tab, returns tab ID
  - `close_tab` - Closes tab by ID
  - `send_to_tab` - Sends input data to specific tab's PTY
  - `resize_terminal` - Resize terminal dimensions
- **Events**:
  - `terminal-data` - Emits PTY output with `{tab_id, data}`
  - `tab-closed` - Emits when PTY process exits

### Frontend (React + TypeScript)

Built with Vite + React + styled-components.

**App.tsx** - Main component:
- Tab state management
- Tauri event listeners
- Keyboard shortcuts

**Keyboard Shortcuts**:
- `Cmd/Ctrl+T` - New tab
- `Cmd/Ctrl+W` - Close tab
- `Cmd/Ctrl+K` - Command palette (if enabled)

**Command Templates**:
Commands support template variables using `{{variable}}` syntax.
Example: `docker exec -it {{container}} bash`

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
JS listen → terminal.write(data)
```

## Build & Run

```bash
npm install        # Install frontend dependencies (first time)
cargo tauri dev    # Development (starts Vite + Tauri)
cargo tauri build  # Production build
```

## Storage

- `localStorage["termos-buttons"]` - Command buttons JSON
- `localStorage["termos-sidebar-width"]` - Sidebar width
