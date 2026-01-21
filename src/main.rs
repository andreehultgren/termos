// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use serde::{Deserialize, Serialize};
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use tauri::{Manager, State};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Button {
    id: String,
    name: String,
    command: String,
}

struct PtyState {
    writer: Arc<Mutex<Box<dyn Write + Send>>>,
}

#[tauri::command]
fn send_to_terminal(data: String, state: State<PtyState>) -> Result<(), String> {
    let mut writer = state.writer.lock().map_err(|e| e.to_string())?;
    writer
        .write_all(data.as_bytes())
        .map_err(|e| e.to_string())?;
    writer.flush().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn resize_terminal(_cols: u16, _rows: u16) -> Result<(), String> {
    // Note: portable-pty doesn't expose resize directly
    // For full implementation would need more complex state management
    Ok(())
}

#[tauri::command]
fn load_buttons() -> Result<String, String> {
    // In a real app, this would load from a file or database
    // For now, return empty array to use localStorage in frontend
    Ok("[]".to_string())
}

#[tauri::command]
fn save_buttons(buttons: String) -> Result<(), String> {
    // In a real app, this would save to a file or database
    // For now, just validate JSON
    serde_json::from_str::<Vec<Button>>(&buttons).map_err(|e| e.to_string())?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            
            // Create PTY
            let pty_system = native_pty_system();
            let pair = pty_system
                .openpty(PtySize {
                    rows: 24,
                    cols: 80,
                    pixel_width: 0,
                    pixel_height: 0,
                })
                .unwrap();

            // Spawn shell
            let mut cmd = CommandBuilder::new("zsh");
            cmd.env("TERM", "xterm-256color");
            let _child = pair.slave.spawn_command(cmd).unwrap();

            let writer = Arc::new(Mutex::new(pair.master.take_writer().unwrap()));
            let mut reader = pair.master.try_clone_reader().unwrap();

            // Manage state
            app.manage(PtyState {
                writer: writer.clone(),
            });

            // Read from PTY and send to frontend
            let window_clone = window.clone();
            std::thread::spawn(move || {
                let mut buf = [0u8; 8192];
                loop {
                    match reader.read(&mut buf) {
                        Ok(n) if n > 0 => {
                            let data = String::from_utf8_lossy(&buf[..n]).to_string();
                            window_clone.emit("terminal-data", data).ok();
                        }
                        Ok(_) => break,
                        Err(e) => {
                            eprintln!("PTY read error: {}", e);
                            break;
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            send_to_terminal,
            resize_terminal,
            load_buttons,
            save_buttons
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
