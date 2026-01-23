# Termos

A steaming terminal application with configurable buttons for commonly used commands.

<img src="./icons/icon.png" alt="Termos Icon" width="200"/>

## Features

- ✅ Interactive terminal with xterm.js and native PTY
- ✅ Resizable sidebar with command buttons
- ✅ Add, edit, and delete command shortcuts
- ✅ Local storage persistence
- ✅ Context menus and modal dialogs
- ✅ Cross-platform (macOS, Linux, Windows)
- ✅ Type-safe button management (Rust library)
- ✅ UUID generation for button IDs
- ✅ Comprehensive test coverage

## Prerequisites

- Rust 1.70+
- System dependencies for Tauri: https://tauri.app/v1/guides/getting-started/prerequisites

## Running the App

```bash
cd rust_version
cargo tauri dev
```

## Building for Production

```bash
cargo tauri build
```

This creates a native application bundle in `target/release/bundle/`

## Project Structure

```
rust_version/
├── Cargo.toml          # Rust dependencies
├── tauri.conf.json     # Tauri configuration
├── build.rs            # Build script
├── src/
│   ├── lib.rs          # Business logic library
│   └── main.rs         # Tauri application entry point
└── dist/               # Frontend files
    ├── index.html      # Main HTML
    ├── style.css       # Styles
    └── renderer.js     # Frontend JavaScript
```

## How It Works

### Backend (Rust)

- Creates a PTY (pseudo-terminal) using `portable-pty`
- Spawns a shell (zsh/bash)
- Reads output from the PTY and sends to frontend via Tauri events
- Receives input from frontend and writes to PTY
- Provides business logic for button management

### Frontend (JavaScript)

- Uses xterm.js for terminal rendering
- Communicates with Rust backend via Tauri's invoke/event system
- Manages button state in localStorage
- Handles UI interactions (modals, context menus, resizing)

## Architecture

The original JavaScript code manages:

1. **Terminal Integration**: xterm.js terminal with fit addon
2. **Button Management**: Sidebar with command buttons stored in localStorage
3. **UI Interactions**: Modal dialogs, context menus, and resizable sidebar

This Rust version provides both the **business logic layer** (lib.rs) and **full Tauri application** (main.rs + dist/).

## Modules

### `lib.rs`

Core business logic with:

- `CommandButton`: Represents a command button with UUID generation
- `ButtonManager`: Manages CRUD operations for buttons
- `TerminalConfig`: Terminal appearance configuration
- `SidebarConfig`: Sidebar layout configuration
- `AppState`: Main application state container

## Library Usage Example

```rust
use termos::{AppState, ButtonManager};

fn main() {
    // Create a new app state
    let mut state = AppState::new();

    // Add a button
    state.button_manager.add_button(
        "List Files".to_string(),
        "ls -la".to_string()
    );

    // Serialize to JSON (for localStorage)
    let json = state.to_json().unwrap();
    println!("State: {}", json);

    // Load from JSON
    let loaded_state = AppState::from_json(&json).unwrap();
    println!("Buttons: {:?}", loaded_state.button_manager.get_buttons());
}
```

## Testing

Run the test suite:

```bash
cargo test
```

## Key Differences from Original Electron Version

1. **Backend**: Rust instead of Node.js
2. **IPC**: Tauri commands/events instead of Electron IPC
3. **PTY**: `portable-pty` crate instead of `node-pty`
4. **Bundle Size**: ~3-5MB instead of ~100MB+
5. **Memory**: Lower memory footprint
6. **Security**: More secure by default
7. **Type Safety**: Strongly typed business logic

## Troubleshooting

### Terminal not showing

Make sure Tauri dependencies are installed for your platform: https://tauri.app/v1/guides/getting-started/prerequisites

### PTY errors

On Linux, you may need to install `libgtk-3-dev` and related packages.

## Future Enhancements

- [x] Multiple terminal tabs
- [ ] Custom themes
- [ ] Command history search
- [ ] Button groups/categories
- [ ] Export/import configurations
- [ ] Persistent session restore
- [ ] File-based button persistence (currently localStorage only)
