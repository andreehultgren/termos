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
  // TERMINAL
  // ============================================
  const term = new Terminal({
    cursorBlink: true,
    theme: {
      background: "#1e1e1e",
      foreground: "#d4d4d4",
    },
  });

  const fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);

  term.open(document.getElementById("terminal"));
  fitAddon.fit();

  // Listen for data from the Rust backend
  await listen("terminal-data", (event) => {
    term.write(event.payload);
  });

  // Send data to the Rust backend
  term.onData((data) => {
    invoke("send_to_terminal", { data });
  });

  // Handle terminal resize
  window.addEventListener("resize", () => {
    fitAddon.fit();
    invoke("resize_terminal", { cols: term.cols, rows: term.rows });
  });

  setTimeout(() => {
    fitAddon.fit();
    invoke("resize_terminal", { cols: term.cols, rows: term.rows });
  }, 100);

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
        invoke("send_to_terminal", { data: btn.command + "\n" });
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
      fitAddon.fit();
      invoke("resize_terminal", { cols: term.cols, rows: term.rows });
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
