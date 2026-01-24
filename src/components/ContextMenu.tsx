import { useEffect } from "react";
import styled from "styled-components";

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
		<div className="context-menu" style={{ display: "block", left: x, top: y }}>
			<ContextItem onMouseUp={onEdit}>Edit</ContextItem>
			<ContextItem onMouseUp={onDelete}>Delete</ContextItem>
		</div>
	);
}
