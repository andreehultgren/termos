// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex, PoisonError};
use tauri::{Manager, State, Window};
use thiserror::Error;

/// PTY-related errors
#[derive(Debug, Error)]
enum PtyError {
    #[error("Failed to open PTY: {0}")]
    Open(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("Failed to spawn command: {0}")]
    Spawn(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("Failed to get PTY writer: {0}")]
    Writer(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("Failed to get PTY reader: {0}")]
    Reader(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("Lock poisoned")]
    LockPoisoned,

    #[error("Tab not found: {0}")]
    TabNotFound(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
}

impl<T> From<PoisonError<T>> for PtyError {
    fn from(_: PoisonError<T>) -> Self {
        PtyError::LockPoisoned
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Button {
    id: String,
    name: String,
    command: String,
}

#[derive(Clone, Serialize)]
struct TabData {
    tab_id: String,
    data: String,
}

#[derive(Clone, Serialize)]
struct TabClosed {
    tab_id: String,
}

struct TabPty {
    writer: Arc<Mutex<Box<dyn Write + Send>>>,
    _master: Box<dyn MasterPty + Send>,  // Keep master alive
    _child: Box<dyn std::any::Any + Send>,  // Keep child process alive
}

struct TabsState {
    tabs: Arc<Mutex<HashMap<String, TabPty>>>,
    next_tab_num: Arc<Mutex<u32>>,
}

fn spawn_tab(tab_id: String, window: Window, tabs: Arc<Mutex<HashMap<String, TabPty>>>) -> Result<(), PtyError> {
    let pty_system = native_pty_system();
    let pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| PtyError::Open(e.into()))?;

    // Get user's home directory for working directory
    let home_dir = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|e| {
            eprintln!("Failed to get home directory (USERPROFILE/HOME): {e}, using current dir");
            ".".to_string()
        });

    // Spawn shell as login shell to inherit user's PATH
    let mut cmd = if cfg!(windows) {
        // Use cmd.exe for now - more reliable than PowerShell in PTY
        let mut cmd = CommandBuilder::new("cmd.exe");
        cmd.cwd(&home_dir);
        cmd
    } else {
        let mut cmd = CommandBuilder::new("zsh");
        cmd.arg("-l");
        cmd
    };
    cmd.env("TERM", "xterm-256color");

    let child = pair.slave.spawn_command(cmd).map_err(|e| PtyError::Spawn(e.into()))?;

    // Get writer and reader before storing
    let writer = pair.master.take_writer().map_err(|e| PtyError::Writer(e.into()))?;
    let mut reader = pair.master.try_clone_reader().map_err(|e| PtyError::Reader(e.into()))?;

    // Store writer, master, and child process - all must stay alive!
    {
        let mut tabs_guard = tabs.lock()?;
        tabs_guard.insert(tab_id.clone(), TabPty {
            writer: Arc::new(Mutex::new(writer)),
            _master: pair.master,
            _child: Box::new(child),
        });
    }

    // Read from PTY and send to frontend with tab_id
    let tab_id_clone = tab_id.clone();
    let tabs_clone = tabs.clone();
    std::thread::spawn(move || {

        let mut buf = [0u8; 8192];
        loop {
            match reader.read(&mut buf) {
                Ok(n) if n > 0 => {
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    if let Err(e) = window.emit(
                        "terminal-data",
                        TabData {
                            tab_id: tab_id_clone.clone(),
                            data,
                        },
                    ) {
                        eprintln!("Failed to emit terminal-data for tab {}: {e}", tab_id_clone);
                    }
                }
                Ok(_) => {
                    break;
                }
                Err(e) => {
                    eprintln!("PTY read error for tab {}: {}", tab_id_clone, e);
                    break;
                }
            }
        }
        // Clean up when PTY closes
        if let Ok(mut tabs_guard) = tabs_clone.lock() {
            tabs_guard.remove(&tab_id_clone);
        } else {
            eprintln!("Failed to acquire lock for tab cleanup: {}", tab_id_clone);
        }
        if let Err(e) = window.emit("tab-closed", TabClosed { tab_id: tab_id_clone.clone() }) {
            eprintln!("Failed to emit tab-closed for tab {}: {e}", tab_id_clone);
        }
    });

    Ok(())
}

#[tauri::command]
fn create_tab(window: Window, state: State<TabsState>) -> Result<String, String> {
    create_tab_inner(window, state).map_err(|e| e.to_string())
}

fn create_tab_inner(window: Window, state: State<TabsState>) -> Result<String, PtyError> {
    let tab_id = {
        let mut num = state.next_tab_num.lock()?;
        let id = format!("tab-{}", *num);
        *num += 1;
        id
    };

    spawn_tab(tab_id.clone(), window, state.tabs.clone())?;
    Ok(tab_id)
}

#[tauri::command]
fn close_tab(tab_id: String, state: State<TabsState>) -> Result<(), String> {
    close_tab_inner(tab_id, state).map_err(|e| e.to_string())
}

fn close_tab_inner(tab_id: String, state: State<TabsState>) -> Result<(), PtyError> {
    let mut tabs = state.tabs.lock()?;
    tabs.remove(&tab_id);
    Ok(())
}

#[tauri::command]
fn send_to_tab(tab_id: String, data: String, state: State<TabsState>) -> Result<(), String> {
    send_to_tab_inner(tab_id, data, state).map_err(|e| e.to_string())
}

fn send_to_tab_inner(tab_id: String, data: String, state: State<TabsState>) -> Result<(), PtyError> {
    let tabs = state.tabs.lock()?;
    let tab = tabs.get(&tab_id).ok_or_else(|| PtyError::TabNotFound(tab_id))?;
    let mut writer = tab.writer.lock()?;
    writer.write_all(data.as_bytes())?;
    writer.flush()?;
    Ok(())
}

#[tauri::command]
fn resize_terminal(_cols: u16, _rows: u16) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
fn load_buttons() -> Result<String, String> {
    Ok("[]".to_string())
}

#[tauri::command]
fn save_buttons(buttons: String) -> Result<(), String> {
    save_buttons_inner(buttons).map_err(|e| e.to_string())
}

fn save_buttons_inner(buttons: String) -> Result<(), PtyError> {
    serde_json::from_str::<Vec<Button>>(&buttons)?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            app.manage(TabsState {
                tabs: Arc::new(Mutex::new(HashMap::new())),
                next_tab_num: Arc::new(Mutex::new(1)),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_tab,
            close_tab,
            send_to_tab,
            resize_terminal,
            load_buttons,
            save_buttons
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
