import { Button, TabBarContainer, TabContainer, TabTitle } from "../components";

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
		<TabBarContainer>
			<TabBarContainer>
				{tabs.map((tab) => {
					const isActive = tab.id === activeTabId;
					return (
						<TabContainer
							key={tab.id}
							$active={isActive}
							onMouseUp={() => onSelectTab(tab.id)}
						>
							<TabTitle $active={isActive}>{tab.title}</TabTitle>
							<Button
								variant="closeTab"
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onCloseTab(tab.id);
								}}
							>
								x
							</Button>
						</TabContainer>
					);
				})}
			</TabBarContainer>
			<Button onClick={onNewTab} type="button" variant="newTab">
				+
			</Button>
		</TabBarContainer>
	);
}
