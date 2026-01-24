import styled from "styled-components";

export default styled.div<{ $active: boolean }>`
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
