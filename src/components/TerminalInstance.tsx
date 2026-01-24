import styled from "styled-components";

export default styled.div<{ $visible: boolean }>`
  width: 100%;
  height: 100%;
  padding: 0.5rem;
  display: ${(props) => (props.$visible ? "block" : "none")};
`;
