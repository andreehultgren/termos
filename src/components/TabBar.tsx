import styled from "styled-components";

const CloseTabButton = styled.button`
  background: none;
  border: none;
  color: #888;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0 0.25rem;
  border-radius: 3px;
  line-height: 1;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: #4d4d4d;
    color: #fff;
  }
`;

const NewTabButton = styled.button`
  background: none;
  border: none;
  color: #888;
  font-size: 1.2rem;
  padding: 0 0.75rem;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: #3d3d3d;
    color: #fff;
  }
`;

const TabTitle = styled.span<{ $active: boolean }>`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.85rem;
  color: ${(props) => (props.$active ? "#fff" : "#ccc")};
`;

const TabContainer = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  padding: 0 0.5rem 0 1rem;
  background: ${(props) => (props.$active ? "#1e1e1e" : "#2d2d2d")};
  border-right: 1px solid #3d3d3d;
  border-bottom: ${(props) =>
		props.$active ? "2px solid #007acc" : "2px solid transparent"};
  cursor: pointer;
  min-width: 120px;
  max-width: 200px;
  transition: background 0.2s ease;
  gap: 0.5rem;

  &:hover {
    background: #3d3d3d;
  }
`;

const Tabs = styled.div`

	display: flex;
	flex: 1;
	overflow-x: auto;
	overflow-y: hidden;


  &::-webkit-scrollbar {
    height: 4px;
  }
`;

const TabBarContainer = styled.div`
	display: flex;
	background: #252525;
	border-bottom: 1px solid #3d3d3d;
	min-height: 36px;
	align-items: stretch;
`;

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
			<Tabs>
				{tabs.map((tab) => {
					const isActive = tab.id === activeTabId;
					return (
						<TabContainer
							key={tab.id}
							$active={isActive}
							onMouseUp={() => onSelectTab(tab.id)}
						>
							<TabTitle $active={isActive}>{tab.title}</TabTitle>
							<CloseTabButton
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onCloseTab(tab.id);
								}}
							>
								x
							</CloseTabButton>
						</TabContainer>
					);
				})}
			</Tabs>
			<NewTabButton onClick={onNewTab} type="button">
				+
			</NewTabButton>
		</TabBarContainer>
	);
}
