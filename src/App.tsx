import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { Sidebar } from "./components/Sidebar";
import { TabBar } from "./components/TabBar";
import { Terminal, type TerminalHandle } from "./components/Terminal";
import { Divider } from "./components/Divider";
import styled from "styled-components";

const Terminals = styled.div`
	flex: 1;
	position: relative;
	overflow: hidden;
`;

const TerminalContainer = styled.div`
	flex: 1;
	background: #1e1e1e;
	position: relative;
	display: flex;
	flex-direction: column;
	overflow: hidden;
`;

interface Tab {
	id: string;
	title: string;
}

interface TerminalDataPayload {
	tab_id: string;
	data: string;
}

interface TabClosedPayload {
	tab_id: string;
}

let tabCounter = 0;

export function App() {
	const [tabs, setTabs] = useState<Tab[]>([]);
	const [activeTabId, setActiveTabId] = useState<string>("");
	const terminalRefs = useRef<Map<string, TerminalHandle>>(new Map());
	const initializedRef = useRef(false);

	// Create initial tab on mount
	useEffect(() => {
		if (!initializedRef.current) {
			initializedRef.current = true;
			handleNewTab();
		}
	}, []);

	// Listen for terminal data from Rust
	useEffect(() => {
		const unlisten = listen<TerminalDataPayload>("terminal-data", (event) => {
			const { tab_id, data } = event.payload;
			const termHandle = terminalRefs.current.get(tab_id);
			termHandle?.write(data);
		});

		return () => {
			unlisten.then((fn) => fn());
		};
	}, []);

	// Listen for tab closed events
	useEffect(() => {
		const unlisten = listen<TabClosedPayload>("tab-closed", (event) => {
			const { tab_id } = event.payload;
			handleRemoveTab(tab_id);
		});

		return () => {
			unlisten.then((fn) => fn());
		};
	}, []);

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "t") {
				e.preventDefault();
				handleNewTab();
			}
			if ((e.metaKey || e.ctrlKey) && e.key === "w") {
				e.preventDefault();
				if (activeTabId && tabs.length > 1) {
					handleCloseTab(activeTabId);
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [activeTabId, tabs.length]);

	// Handle window resize
	useEffect(() => {
		const handleResize = () => fitAllTerminals();
		window.addEventListener("resize", handleResize);
		setTimeout(fitAllTerminals, 100);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const fitAllTerminals = useCallback(() => {
		const handles = terminalRefs.current;
		for (const handle of handles.values()) {
			handle.fit();
		}
		if (activeTabId) {
			const activeHandle = terminalRefs.current.get(activeTabId);
			if (activeHandle) {
				const size = activeHandle.getSize();
				invoke("resize_terminal", { cols: size.cols, rows: size.rows });
			}
		}
	}, [activeTabId]);

	const handleNewTab = async () => {
		try {
			const tabId = await invoke<string>("create_tab");
			tabCounter++;
			const newTab: Tab = {
				id: tabId,
				title: `Terminal ${tabCounter + 1}`,
			};
			setTabs((prev) => [...prev, newTab]);
			setActiveTabId(tabId);
		} catch (err) {
			console.error("Failed to create tab:", err);
		}
	};

	const handleCloseTab = async (tabId: string) => {
		if (tabs.length <= 1) return;

		try {
			await invoke("close_tab", { tabId });
		} catch (err) {
			console.error("Failed to close tab:", err);
		}

		handleRemoveTab(tabId);
	};

	const handleRemoveTab = (tabId: string) => {
		terminalRefs.current.delete(tabId);
		setTabs((prev) => {
			const newTabs = prev.filter((t) => t.id !== tabId);
			if (activeTabId === tabId && newTabs.length > 0) {
				setActiveTabId(newTabs[newTabs.length - 1].id);
			}
			return newTabs;
		});
	};

	const handleSelectTab = (tabId: string) => {
		setActiveTabId(tabId);
		setTimeout(() => {
			const handle = terminalRefs.current.get(tabId);
			handle?.fit();
			handle?.focus();
		}, 10);
	};

	const handleTerminalData = useCallback(
		(tabId: string) => (data: string) => {
			invoke("send_to_tab", { tabId, data });
		},
		[],
	);

	const handleRunCommand = (command: string) => {
		if (activeTabId) {
			invoke("send_to_tab", { tabId: activeTabId, data: command });
		}
	};

	const setTerminalRef = useCallback(
		(tabId: string, handle: TerminalHandle | null) => {
			if (handle) {
				terminalRefs.current.set(tabId, handle);
			} else {
				terminalRefs.current.delete(tabId);
			}
		},
		[],
	);

	return (
		<div id="app">
			<Sidebar onRunCommand={handleRunCommand} />
			<Divider onResize={fitAllTerminals} />
			<TerminalContainer>
				<TabBar
					tabs={tabs}
					activeTabId={activeTabId}
					onSelectTab={handleSelectTab}
					onCloseTab={handleCloseTab}
					onNewTab={handleNewTab}
				/>
				<Terminals>
					{tabs.map((tab) => (
						<Terminal
							key={tab.id}
							ref={(handle) => setTerminalRef(tab.id, handle)}
							onData={handleTerminalData(tab.id)}
							visible={tab.id === activeTabId}
						/>
					))}
				</Terminals>
			</TerminalContainer>
		</div>
	);
}
