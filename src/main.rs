// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use tauri::{Manager, State, Window};

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
    writer: Box<dyn Write + Send>,
}

struct TabsState {
    tabs: Arc<Mutex<HashMap<String, TabPty>>>,
    next_tab_num: Arc<Mutex<u32>>,
}

fn spawn_tab(tab_id: String, window: Window, tabs: Arc<Mutex<HashMap<String, TabPty>>>) -> Result<(), String> {
    let pty_system = native_pty_system();
    let pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;

    // Spawn shell as login shell to inherit user's PATH
    let mut cmd = CommandBuilder::new("zsh");
    cmd.arg("-l");
    cmd.env("TERM", "xterm-256color");
    pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;

    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;
    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;

    // Store the writer
    {
        let mut tabs_guard = tabs.lock().map_err(|e| e.to_string())?;
        tabs_guard.insert(tab_id.clone(), TabPty { writer });
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
                    window
                        .emit(
                            "terminal-data",
                            TabData {
                                tab_id: tab_id_clone.clone(),
                                data,
                            },
                        )
                        .ok();
                }
                Ok(_) => break,
                Err(e) => {
                    eprintln!("PTY read error for tab {}: {}", tab_id_clone, e);
                    break;
                }
            }
        }
        // Clean up when PTY closes
        if let Ok(mut tabs_guard) = tabs_clone.lock() {
            tabs_guard.remove(&tab_id_clone);
        }
        window.emit("tab-closed", TabClosed { tab_id: tab_id_clone }).ok();
    });

    Ok(())
}

#[tauri::command]
fn create_tab(window: Window, state: State<TabsState>) -> Result<String, String> {
    let tab_id = {
        let mut num = state.next_tab_num.lock().map_err(|e| e.to_string())?;
        let id = format!("tab-{}", *num);
        *num += 1;
        id
    };

    spawn_tab(tab_id.clone(), window, state.tabs.clone())?;
    Ok(tab_id)
}

#[tauri::command]
fn close_tab(tab_id: String, state: State<TabsState>) -> Result<(), String> {
    let mut tabs = state.tabs.lock().map_err(|e| e.to_string())?;
    tabs.remove(&tab_id);
    Ok(())
}

#[tauri::command]
fn send_to_tab(tab_id: String, data: String, state: State<TabsState>) -> Result<(), String> {
    let mut tabs = state.tabs.lock().map_err(|e| e.to_string())?;
    if let Some(tab) = tabs.get_mut(&tab_id) {
        tab.writer
            .write_all(data.as_bytes())
            .map_err(|e| e.to_string())?;
        tab.writer.flush().map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err(format!("Tab {} not found", tab_id))
    }
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
    serde_json::from_str::<Vec<Button>>(&buttons).map_err(|e| e.to_string())?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            let tabs: Arc<Mutex<HashMap<String, TabPty>>> = Arc::new(Mutex::new(HashMap::new()));

            app.manage(TabsState {
                tabs: tabs.clone(),
                next_tab_num: Arc::new(Mutex::new(1)),
            });

            // Create initial tab
            spawn_tab("tab-0".to_string(), window, tabs).expect("Failed to create initial tab");

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
