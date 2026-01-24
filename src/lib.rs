use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use thiserror::Error;
use uuid::Uuid;

/// Application-level errors
#[derive(Debug, Error)]
pub enum AppError {
    #[error("Button not found: {0}")]
    ButtonNotFound(String),

    #[error("Tab not found: {0}")]
    TabNotFound(String),

    #[error("Cannot close the last tab")]
    CannotCloseLastTab,

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
}

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
    pub fn from_json(json: &str) -> Result<Self, AppError> {
        let buttons: Vec<CommandButton> = serde_json::from_str(json)?;
        Ok(Self { buttons })
    }

    /// Serializes buttons to JSON string (for localStorage)
    pub fn to_json(&self) -> Result<String, AppError> {
        Ok(serde_json::to_string(&self.buttons)?)
    }

    /// Adds a new button and returns its ID
    pub fn add_button(&mut self, name: String, command: String) -> String {
        let button = CommandButton::new(name, command);
        let id = button.id.clone();
        self.buttons.push(button);
        id
    }

    /// Updates an existing button
    pub fn update_button(
        &mut self,
        id: &str,
        name: String,
        command: String,
    ) -> Result<(), AppError> {
        if let Some(button) = self.buttons.iter_mut().find(|b| b.id == id) {
            button.name = name;
            button.command = command;
            Ok(())
        } else {
            Err(AppError::ButtonNotFound(id.to_owned()))
        }
    }

    /// Deletes a button by ID
    pub fn delete_button(&mut self, id: &str) -> Result<(), AppError> {
        let initial_len = self.buttons.len();
        self.buttons.retain(|b| b.id != id);
        if self.buttons.len() < initial_len {
            Ok(())
        } else {
            Err(AppError::ButtonNotFound(id.to_owned()))
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
    pub fn to_json(&self) -> Result<String, AppError> {
        Ok(serde_json::to_string(self)?)
    }

    /// Loads the state from JSON
    pub fn from_json(json: &str) -> Result<Self, AppError> {
        Ok(serde_json::from_str(json)?)
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

/// Manages tab IDs and tracks active tabs
#[derive(Debug, Clone)]
pub struct TabManager {
    next_tab_num: u32,
    active_tabs: HashSet<String>,
    active_tab_id: Option<String>,
}

impl TabManager {
    /// Creates a new TabManager
    pub fn new() -> Self {
        Self {
            next_tab_num: 0,
            active_tabs: HashSet::new(),
            active_tab_id: None,
        }
    }

    /// Creates a new tab and returns its ID
    pub fn create_tab(&mut self) -> String {
        let tab_id = format!("tab-{}", self.next_tab_num);
        self.next_tab_num += 1;
        self.active_tabs.insert(tab_id.clone());

        // Set as active if it's the first tab
        if self.active_tab_id.is_none() {
            self.active_tab_id = Some(tab_id.clone());
        }

        tab_id
    }

    /// Closes a tab by ID. Returns error if tab doesn't exist or is the last tab.
    pub fn close_tab(&mut self, tab_id: &str) -> Result<(), AppError> {
        if !self.active_tabs.contains(tab_id) {
            return Err(AppError::TabNotFound(tab_id.to_owned()));
        }

        if self.active_tabs.len() <= 1 {
            return Err(AppError::CannotCloseLastTab);
        }

        self.active_tabs.remove(tab_id);

        // If we closed the active tab, switch to another one
        if self.active_tab_id.as_deref() == Some(tab_id) {
            self.active_tab_id = self.active_tabs.iter().next().cloned();
        }

        Ok(())
    }

    /// Switches to a tab by ID
    pub fn switch_to_tab(&mut self, tab_id: &str) -> Result<(), AppError> {
        if !self.active_tabs.contains(tab_id) {
            return Err(AppError::TabNotFound(tab_id.to_owned()));
        }
        self.active_tab_id = Some(tab_id.to_string());
        Ok(())
    }

    /// Gets the currently active tab ID
    pub fn active_tab(&self) -> Option<&str> {
        self.active_tab_id.as_deref()
    }

    /// Checks if a tab exists
    pub fn has_tab(&self, tab_id: &str) -> bool {
        self.active_tabs.contains(tab_id)
    }

    /// Gets the number of open tabs
    pub fn tab_count(&self) -> usize {
        self.active_tabs.len()
    }

    /// Gets all tab IDs
    pub fn get_tab_ids(&self) -> Vec<String> {
        let mut ids: Vec<_> = self.active_tabs.iter().cloned().collect();
        ids.sort(); // Sort for consistent ordering
        ids
    }

    /// Gets the next tab number (for display purposes)
    pub fn next_tab_number(&self) -> u32 {
        self.next_tab_num
    }
}

impl Default for TabManager {
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
        let id = manager.add_button("Test".to_string(), "echo test".to_string());

        manager
            .update_button(&id, "Updated".to_string(), "echo updated".to_string())
            .expect("button should exist");

        let updated = manager.get_button(&id).expect("button should exist");
        assert_eq!(updated.name, "Updated");
        assert_eq!(updated.command, "echo updated");
    }

    #[test]
    fn test_button_manager_delete() {
        let mut manager = ButtonManager::new();
        let id = manager.add_button("Test".to_string(), "echo test".to_string());

        manager.delete_button(&id).expect("button should exist");
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

    // ============================================
    // Tab Manager Tests
    // ============================================

    #[test]
    fn test_tab_manager_create_tab() {
        let mut manager = TabManager::new();

        let tab1 = manager.create_tab();
        assert_eq!(tab1, "tab-0");
        assert_eq!(manager.tab_count(), 1);
        assert!(manager.has_tab("tab-0"));

        let tab2 = manager.create_tab();
        assert_eq!(tab2, "tab-1");
        assert_eq!(manager.tab_count(), 2);
    }

    #[test]
    fn test_tab_manager_first_tab_is_active() {
        let mut manager = TabManager::new();

        let tab1 = manager.create_tab();
        assert_eq!(manager.active_tab(), Some(tab1.as_str()));

        // Creating second tab doesn't change active
        manager.create_tab();
        assert_eq!(manager.active_tab(), Some("tab-0"));
    }

    #[test]
    fn test_tab_manager_close_tab() {
        let mut manager = TabManager::new();

        manager.create_tab(); // tab-0
        manager.create_tab(); // tab-1

        let result = manager.close_tab("tab-0");
        assert!(result.is_ok());
        assert_eq!(manager.tab_count(), 1);
        assert!(!manager.has_tab("tab-0"));
        assert!(manager.has_tab("tab-1"));
    }

    #[test]
    fn test_tab_manager_cannot_close_last_tab() {
        let mut manager = TabManager::new();

        manager.create_tab(); // tab-0

        let result = manager.close_tab("tab-0");
        assert!(matches!(result, Err(AppError::CannotCloseLastTab)));
        assert_eq!(manager.tab_count(), 1);
    }

    #[test]
    fn test_tab_manager_close_nonexistent_tab() {
        let mut manager = TabManager::new();

        manager.create_tab();

        let result = manager.close_tab("tab-999");
        assert!(matches!(result, Err(AppError::TabNotFound(_))));
    }

    #[test]
    fn test_tab_manager_switch_tab() {
        let mut manager = TabManager::new();

        manager.create_tab(); // tab-0
        manager.create_tab(); // tab-1

        assert_eq!(manager.active_tab(), Some("tab-0"));

        let result = manager.switch_to_tab("tab-1");
        assert!(result.is_ok());
        assert_eq!(manager.active_tab(), Some("tab-1"));
    }

    #[test]
    fn test_tab_manager_switch_to_nonexistent_tab() {
        let mut manager = TabManager::new();

        manager.create_tab();

        let result = manager.switch_to_tab("tab-999");
        assert!(result.is_err());
    }

    #[test]
    fn test_tab_manager_close_active_tab_switches() {
        let mut manager = TabManager::new();

        manager.create_tab(); // tab-0
        manager.create_tab(); // tab-1
        manager.create_tab(); // tab-2

        // Switch to tab-1 and close it
        manager.switch_to_tab("tab-1").unwrap();
        assert_eq!(manager.active_tab(), Some("tab-1"));

        manager.close_tab("tab-1").unwrap();

        // Should have switched to another tab
        assert!(manager.active_tab().is_some());
        assert_ne!(manager.active_tab(), Some("tab-1"));
    }

    #[test]
    fn test_tab_manager_get_tab_ids() {
        let mut manager = TabManager::new();

        manager.create_tab();
        manager.create_tab();
        manager.create_tab();

        let ids = manager.get_tab_ids();
        assert_eq!(ids.len(), 3);
        assert!(ids.contains(&"tab-0".to_string()));
        assert!(ids.contains(&"tab-1".to_string()));
        assert!(ids.contains(&"tab-2".to_string()));
    }

    #[test]
    fn test_tab_manager_tab_numbers_increment() {
        let mut manager = TabManager::new();

        manager.create_tab(); // tab-0
        manager.create_tab(); // tab-1
        manager.close_tab("tab-0").unwrap();

        // Next tab should be tab-2, not tab-0
        let new_tab = manager.create_tab();
        assert_eq!(new_tab, "tab-2");
    }
}
