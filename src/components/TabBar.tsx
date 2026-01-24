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
            <TabTitle $active={tab.id === activeTabId}>{tab.title}</TabTitle>
            <CloseTabButton
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
            >
              x
            </CloseTabButton>
          </div>
        ))}
      </div>
      <NewTabButton onClick={onNewTab} type="button">
        +
      </NewTabButton>
    </div>
  );
}
