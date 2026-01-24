import { useEffect } from "react";
import styled from "styled-components";

const StyledContextMenu = styled.div<{ $x: number; $y: number }>`
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

const ContextItem = styled.div`
	padding: 0.6rem 1rem;
	cursor: pointer;
	color: #fff;
	transition: background 0.2s;

	&:hover {
	  background: #3d3d3d;
  }
`;

interface ContextMenuProps {
	x: number;
	y: number;
	onEdit: () => void;
	onDelete: () => void;
	onClose: () => void;
}

export function ContextMenu({
	x,
	y,
	onEdit,
	onDelete,
	onClose,
}: ContextMenuProps) {
	useEffect(() => {
		const handleClick = () => onClose();
		document.addEventListener("click", handleClick);
		return () => document.removeEventListener("click", handleClick);
	}, [onClose]);

	return (
		<StyledContextMenu $x={x} $y={y}>
			<ContextItem onMouseUp={onEdit}>Edit</ContextItem>
			<ContextItem onMouseUp={onDelete}>Delete</ContextItem>
		</StyledContextMenu>
	);
}
