import styled from "styled-components";

export default styled.div<{ $x: number; $y: number }>`
	position: fixed;
	background: #2d2d2d;
	border: 1px solid #3d3d3d;
	border-radius: 4px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
	z-index: 1000;
	min-width: 120px;
  display: block;
  left: ${(props) => props.$x}px; 
  top: ${(props) => props.$y}px;
`;
