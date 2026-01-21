use serde::{Deserialize, Serialize};
use std::error::Error;
use uuid::Uuid;

/// Represents a command button in the sidebar
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CommandButton {
    pub id: String,
    pub name: String,
    pub command: String,
}

impl CommandButton {
    /// Creates a new CommandButton with a generated UUID
    pub fn new(name: String, command: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            command,
        }
    }

    /// Creates a CommandButton with a specific ID (for loading from storage)
    pub fn with_id(id: String, name: String, command: String) -> Self {
        Self { id, name, command }
    }
}

/// Manages the collection of command buttons
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ButtonManager {
    buttons: Vec<CommandButton>,
}

impl ButtonManager {
    /// Creates a new empty ButtonManager
    pub fn new() -> Self {
        Self {
            buttons: Vec::new(),
        }
    }

    /// Loads buttons from JSON string (simulating localStorage)
    pub fn from_json(json: &str) -> Result<Self, Box<dyn Error>> {
        let buttons: Vec<CommandButton> = serde_json::from_str(json)?;
        Ok(Self { buttons })
    }

    /// Serializes buttons to JSON string (for localStorage)
    pub fn to_json(&self) -> Result<String, Box<dyn Error>> {
        Ok(serde_json::to_string(&self.buttons)?)
    }

    /// Adds a new button
    pub fn add_button(&mut self, name: String, command: String) -> &CommandButton {
        let button = CommandButton::new(name, command);
        self.buttons.push(button);
        self.buttons.last().unwrap()
    }

    /// Updates an existing button
    pub fn update_button(
        &mut self,
        id: &str,
        name: String,
        command: String,
    ) -> Result<(), String> {
        if let Some(button) = self.buttons.iter_mut().find(|b| b.id == id) {
            button.name = name;
            button.command = command;
            Ok(())
        } else {
            Err(format!("Button with id {} not found", id))
        }
    }

    /// Deletes a button by ID
    pub fn delete_button(&mut self, id: &str) -> Result<(), String> {
        let initial_len = self.buttons.len();
        self.buttons.retain(|b| b.id != id);
        if self.buttons.len() < initial_len {
            Ok(())
        } else {
            Err(format!("Button with id {} not found", id))
        }
    }

    /// Gets a button by ID
    pub fn get_button(&self, id: &str) -> Option<&CommandButton> {
        self.buttons.iter().find(|b| b.id == id)
    }

    /// Gets all buttons
    pub fn get_buttons(&self) -> &[CommandButton] {
        &self.buttons
    }

    /// Gets the number of buttons
    pub fn count(&self) -> usize {
        self.buttons.len()
    }
}

impl Default for ButtonManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Terminal configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalConfig {
    pub cursor_blink: bool,
    pub background_color: String,
    pub foreground_color: String,
}

impl Default for TerminalConfig {
    fn default() -> Self {
        Self {
            cursor_blink: true,
            background_color: "#1e1e1e".to_string(),
            foreground_color: "#d4d4d4".to_string(),
        }
    }
}

/// Sidebar configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidebarConfig {
    pub width: u32,
}

impl Default for SidebarConfig {
    fn default() -> Self {
        Self { width: 200 }
    }
}

/// Application state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppState {
    pub button_manager: ButtonManager,
    pub terminal_config: TerminalConfig,
    pub sidebar_config: SidebarConfig,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            button_manager: ButtonManager::new(),
            terminal_config: TerminalConfig::default(),
            sidebar_config: SidebarConfig::default(),
        }
    }

    /// Saves the state to JSON
    pub fn to_json(&self) -> Result<String, Box<dyn Error>> {
        Ok(serde_json::to_string(self)?)
    }

    /// Loads the state from JSON
    pub fn from_json(json: &str) -> Result<Self, Box<dyn Error>> {
        Ok(serde_json::from_str(json)?)
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_button_creation() {
        let button = CommandButton::new("Test".to_string(), "echo test".to_string());
        assert_eq!(button.name, "Test");
        assert_eq!(button.command, "echo test");
        assert!(!button.id.is_empty());
    }

    #[test]
    fn test_button_manager_add() {
        let mut manager = ButtonManager::new();
        manager.add_button("Test".to_string(), "echo test".to_string());
        assert_eq!(manager.count(), 1);
    }

    #[test]
    fn test_button_manager_update() {
        let mut manager = ButtonManager::new();
        let button = manager.add_button("Test".to_string(), "echo test".to_string());
        let id = button.id.clone();

        manager
            .update_button(&id, "Updated".to_string(), "echo updated".to_string())
            .unwrap();

        let updated = manager.get_button(&id).unwrap();
        assert_eq!(updated.name, "Updated");
        assert_eq!(updated.command, "echo updated");
    }

    #[test]
    fn test_button_manager_delete() {
        let mut manager = ButtonManager::new();
        let button = manager.add_button("Test".to_string(), "echo test".to_string());
        let id = button.id.clone();

        manager.delete_button(&id).unwrap();
        assert_eq!(manager.count(), 0);
    }

    #[test]
    fn test_button_manager_json() {
        let mut manager = ButtonManager::new();
        manager.add_button("Test1".to_string(), "echo 1".to_string());
        manager.add_button("Test2".to_string(), "echo 2".to_string());

        let json = manager.to_json().unwrap();
        let loaded = ButtonManager::from_json(&json).unwrap();

        assert_eq!(loaded.count(), 2);
        assert_eq!(loaded.buttons[0].name, "Test1");
        assert_eq!(loaded.buttons[1].name, "Test2");
    }

    #[test]
    fn test_app_state_serialization() {
        let mut state = AppState::new();
        state
            .button_manager
            .add_button("Test".to_string(), "echo test".to_string());

        let json = state.to_json().unwrap();
        let loaded = AppState::from_json(&json).unwrap();

        assert_eq!(loaded.button_manager.count(), 1);
        assert_eq!(loaded.terminal_config.cursor_blink, true);
    }
}
