interface Tab {
	id: string;
	title: string;
}

interface TabBarProps {
	tabs: Tab[];
	activeTabId: string | null;
	onSelectTab: (tabId: string) => void;
	onCloseTab: (tabId: string) => void;
	onNewTab: () => void;
}

export function TabBar({
	tabs,
	activeTabId,
	onSelectTab,
	onCloseTab,
	onNewTab,
}: TabBarProps) {
	return (
		<div id="tab-bar">
			<div id="tabs">
				{tabs.map((tab) => (
					<div
						key={tab.id}
						className={`tab ${tab.id === activeTabId ? "active" : ""}`}
						onMouseUp={() => onSelectTab(tab.id)}
					>
						<span className="tab-title">{tab.title}</span>
						<button
							className="tab-close"
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onCloseTab(tab.id);
							}}
						>
							×
						</button>
					</div>
				))}
			</div>
			<button className="new-tab-button" onClick={onNewTab} type="button">
				+
			</button>
		</div>
	);
}
