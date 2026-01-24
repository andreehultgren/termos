import { useEffect } from "react";
import { ContextMenuContainer, ContextMenuItem } from "../components";

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
		<ContextMenuContainer $x={x} $y={y}>
			<ContextMenuItem onMouseUp={onEdit}>Edit</ContextMenuItem>
			<ContextMenuItem onMouseUp={onDelete}>Delete</ContextMenuItem>
		</ContextMenuContainer>
	);
}
