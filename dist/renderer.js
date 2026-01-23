// Wait for Tauri API to be ready
window.addEventListener("DOMContentLoaded", async () => {
  // Check if Tauri API is available
  if (!window.__TAURI__) {
    console.error("Tauri API not available");
    return;
  }

  const { invoke } = window.__TAURI__.tauri;
  const { listen } = window.__TAURI__.event;

  // ============================================
  // TAB MANAGEMENT
  // ============================================
  const tabs = new Map(); // tabId -> { term, fitAddon, element }
  let activeTabId = null;

  const tabsContainer = document.getElementById("tabs");
  const terminalsContainer = document.getElementById("terminals");
  const newTabBtn = document.getElementById("new-tab-btn");

  function createTerminalInstance(tabId) {
    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: "#1e1e1e",
        foreground: "#d4d4d4",
      },
    });

    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);

    // Create terminal DOM element
    const termEl = document.createElement("div");
    termEl.className = "terminal-instance";
    termEl.id = `terminal-${tabId}`;
    termEl.style.display = "none";
    terminalsContainer.appendChild(termEl);

    term.open(termEl);

    // Send data to the backend
    term.onData((data) => {
      invoke("send_to_tab", { tabId, data });
    });

    return { term, fitAddon, element: termEl };
  }

  function createTabElement(tabId, tabNumber) {
    const tabEl = document.createElement("div");
    tabEl.className = "tab";
    tabEl.dataset.tabId = tabId;

    const titleSpan = document.createElement("span");
    titleSpan.className = "tab-title";
    titleSpan.textContent = `Terminal ${tabNumber}`;
    tabEl.appendChild(titleSpan);

    const closeBtn = document.createElement("button");
    closeBtn.className = "tab-close";
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeTab(tabId);
    });
    tabEl.appendChild(closeBtn);

    tabEl.addEventListener("click", () => {
      switchToTab(tabId);
    });

    return tabEl;
  }

  function switchToTab(tabId) {
    if (activeTabId === tabId) return;

    // Hide current tab
    if (activeTabId && tabs.has(activeTabId)) {
      const current = tabs.get(activeTabId);
      current.element.style.display = "none";
      const currentTabEl = tabsContainer.querySelector(`[data-tab-id="${activeTabId}"]`);
      if (currentTabEl) currentTabEl.classList.remove("active");
    }

    // Show new tab
    const newTab = tabs.get(tabId);
    if (newTab) {
      newTab.element.style.display = "block";
      const newTabEl = tabsContainer.querySelector(`[data-tab-id="${tabId}"]`);
      if (newTabEl) newTabEl.classList.add("active");
      activeTabId = tabId;

      // Fit and focus
      setTimeout(() => {
        newTab.fitAddon.fit();
        newTab.term.focus();
      }, 10);
    }
  }

  async function createTab() {
    try {
      const tabId = await invoke("create_tab");
      const tabNumber = tabId.split("-")[1];

      const tabData = createTerminalInstance(tabId);
      tabs.set(tabId, tabData);

      const tabEl = createTabElement(tabId, parseInt(tabNumber) + 1);
      tabsContainer.appendChild(tabEl);

      switchToTab(tabId);
    } catch (err) {
      console.error("Failed to create tab:", err);
    }
  }

  async function closeTab(tabId) {
    if (tabs.size <= 1) {
      // Don't close the last tab
      return;
    }

    try {
      await invoke("close_tab", { tabId });
    } catch (err) {
      console.error("Failed to close tab:", err);
    }

    removeTabUI(tabId);
  }

  function removeTabUI(tabId) {
    const tabData = tabs.get(tabId);
    if (tabData) {
      tabData.term.dispose();
      tabData.element.remove();
      tabs.delete(tabId);
    }

    const tabEl = tabsContainer.querySelector(`[data-tab-id="${tabId}"]`);
    if (tabEl) tabEl.remove();

    // Switch to another tab if this was active
    if (activeTabId === tabId) {
      activeTabId = null;
      const remainingTabs = Array.from(tabs.keys());
      if (remainingTabs.length > 0) {
        switchToTab(remainingTabs[remainingTabs.length - 1]);
      }
    }
  }

  // Listen for data from the Rust backend
  await listen("terminal-data", (event) => {
    const { tab_id, data } = event.payload;
    const tabData = tabs.get(tab_id);
    if (tabData) {
      tabData.term.write(data);
    }
  });

  // Listen for tab closed events (when PTY exits)
  await listen("tab-closed", (event) => {
    const { tab_id } = event.payload;
    removeTabUI(tab_id);
  });

  // New tab button
  newTabBtn.addEventListener("click", createTab);

  // Keyboard shortcut for new tab (Cmd/Ctrl + T)
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "t") {
      e.preventDefault();
      createTab();
    }
    // Close tab with Cmd/Ctrl + W
    if ((e.metaKey || e.ctrlKey) && e.key === "w") {
      e.preventDefault();
      if (activeTabId) {
        closeTab(activeTabId);
      }
    }
  });

  // Initialize first tab
  const initialTabId = "tab-0";
  const initialTabData = createTerminalInstance(initialTabId);
  tabs.set(initialTabId, initialTabData);
  const initialTabEl = createTabElement(initialTabId, 1);
  tabsContainer.appendChild(initialTabEl);
  switchToTab(initialTabId);

  // Handle terminal resize
  function fitAllTerminals() {
    tabs.forEach((tabData) => {
      tabData.fitAddon.fit();
    });
    if (activeTabId && tabs.has(activeTabId)) {
      const active = tabs.get(activeTabId);
      invoke("resize_terminal", { cols: active.term.cols, rows: active.term.rows });
    }
  }

  window.addEventListener("resize", fitAllTerminals);

  setTimeout(fitAllTerminals, 100);

  // ============================================
  // SIDEBAR BUTTONS (using localStorage)
  // ============================================
  let buttons = [];
  let editingButtonId = null;
  let contextButtonId = null;

  const buttonList = document.getElementById("button-list");
  const addBtn = document.getElementById("add-btn");
  const contextMenu = document.getElementById("context-menu");
  const ctxEdit = document.getElementById("ctx-edit");
  const ctxDelete = document.getElementById("ctx-delete");
  const modalOverlay = document.getElementById("modal-overlay");
  const modalTitle = document.getElementById("modal-title");
  const btnNameInput = document.getElementById("btn-name");
  const btnCommandInput = document.getElementById("btn-command");
  const modalSave = document.getElementById("modal-save");
  const modalCancel = document.getElementById("modal-cancel");

  function generateId() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function renderButtons() {
    buttonList.innerHTML = "";
    buttons.forEach((btn) => {
      const el = document.createElement("button");
      el.className = "command-btn";
      el.textContent = btn.name;
      el.dataset.id = btn.id;
      el.addEventListener("click", () => {
        // Send command to active tab
        if (activeTabId) {
          invoke("send_to_tab", { tabId: activeTabId, data: btn.command + "\n" });
        }
      });
      el.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        contextButtonId = btn.id;
        contextMenu.style.display = "block";
        contextMenu.style.left = e.clientX + "px";
        contextMenu.style.top = e.clientY + "px";
      });
      buttonList.appendChild(el);
    });
  }

  function loadButtonsFromStorage() {
    try {
      const stored = localStorage.getItem("termos-buttons");
      buttons = stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.error("Failed to load buttons:", err);
      buttons = [];
    }
    renderButtons();
  }

  function saveButtonsToStorage() {
    try {
      localStorage.setItem("termos-buttons", JSON.stringify(buttons));
    } catch (err) {
      console.error("Failed to save buttons:", err);
    }
  }

  function openModal(title, name = "", command = "") {
    modalTitle.textContent = title;
    btnNameInput.value = name;
    btnCommandInput.value = command;
    modalOverlay.style.display = "flex";
    btnNameInput.focus();
  }

  function closeModal() {
    modalOverlay.style.display = "none";
    editingButtonId = null;
  }

  function hideContextMenu() {
    contextMenu.style.display = "none";
    contextButtonId = null;
  }

  // Event listeners
  addBtn.addEventListener("click", () => {
    editingButtonId = null;
    openModal("Add Command");
  });

  modalCancel.addEventListener("click", closeModal);

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  modalSave.addEventListener("click", () => {
    const name = btnNameInput.value.trim();
    const command = btnCommandInput.value.trim();

    if (!name || !command) return;

    if (editingButtonId) {
      buttons = buttons.map((btn) =>
        btn.id === editingButtonId ? { ...btn, name, command } : btn,
      );
    } else {
      buttons.push({ id: generateId(), name, command });
    }

    saveButtonsToStorage();
    renderButtons();
    closeModal();
  });

  document.addEventListener("click", (e) => {
    if (!contextMenu.contains(e.target)) {
      hideContextMenu();
    }
  });

  ctxEdit.addEventListener("click", () => {
    const btn = buttons.find((b) => b.id === contextButtonId);
    if (btn) {
      editingButtonId = btn.id;
      openModal("Edit Command", btn.name, btn.command);
    }
    hideContextMenu();
  });

  ctxDelete.addEventListener("click", () => {
    if (contextButtonId && confirm("Delete this command button?")) {
      buttons = buttons.filter((b) => b.id !== contextButtonId);
      saveButtonsToStorage();
      renderButtons();
    }
    hideContextMenu();
  });

  // Keyboard shortcuts
  btnNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      btnCommandInput.focus();
    }
  });

  btnCommandInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      modalSave.click();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (modalOverlay.style.display === "flex") {
        closeModal();
      }
      hideContextMenu();
    }
  });

  // ============================================
  // RESIZABLE DIVIDER
  // ============================================
  const divider = document.getElementById("divider");
  const sidebar = document.getElementById("sidebar");
  let isResizing = false;

  divider.addEventListener("mousedown", (e) => {
    isResizing = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    const newWidth = e.clientX;
    if (newWidth >= 100 && newWidth <= 500) {
      sidebar.style.width = newWidth + "px";
      fitAllTerminals();
    }
  });

  document.addEventListener("mouseup", () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      localStorage.setItem("termos-sidebar-width", sidebar.style.width);
    }
  });

  // Restore sidebar width
  const savedWidth = localStorage.getItem("termos-sidebar-width");
  if (savedWidth) {
    sidebar.style.width = savedWidth;
  }

  // Initialize buttons
  loadButtonsFromStorage();
});
