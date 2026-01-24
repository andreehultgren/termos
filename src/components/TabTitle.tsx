import styled from "styled-components";

export default styled.span<{ $active: boolean }>`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.85rem;
  color: ${(props) => (props.$active ? "#fff" : "#ccc")};
`;
