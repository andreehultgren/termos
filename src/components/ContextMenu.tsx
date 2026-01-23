import { useEffect } from "react";

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
			<div className="context-item" onMouseUp={onEdit}>
				Edit
			</div>
			<div className="context-item" onMouseUp={onDelete}>
				Delete
			</div>
		</div>
	);
}
