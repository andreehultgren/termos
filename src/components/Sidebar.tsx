import { useState, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Modal } from "./Modal";
import { ContextMenu } from "./ContextMenu";

interface CommandButton {
	id: string;
	name: string;
	command: string;
}

interface SidebarProps {
	onRunCommand: (command: string) => void;
}

function generateId(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

export function Sidebar({ onRunCommand }: SidebarProps) {
	const [buttons, setButtons] = useLocalStorage<CommandButton[]>(
		"termos-buttons",
		[],
	);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingButton, setEditingButton] = useState<CommandButton | null>(
		null,
	);
	const [contextMenu, setContextMenu] = useState<{
		x: number;
		y: number;
		buttonId: string;
	} | null>(null);

	const handleAddClick = () => {
		setEditingButton(null);
		setModalOpen(true);
	};

	const handleSave = (name: string, command: string) => {
		if (editingButton) {
			setButtons(
				buttons.map((btn) =>
					btn.id === editingButton.id ? { ...btn, name, command } : btn,
				),
			);
		} else {
			setButtons([...buttons, { id: generateId(), name, command }]);
		}
		setModalOpen(false);
		setEditingButton(null);
	};

	const handleCloseModal = () => {
		setModalOpen(false);
		setEditingButton(null);
	};

	const handleContextMenu = useCallback(
		(e: React.MouseEvent, buttonId: string) => {
			e.preventDefault();
			setContextMenu({ x: e.clientX, y: e.clientY, buttonId });
		},
		[],
	);

	const handleEdit = () => {
		if (contextMenu) {
			const btn = buttons.find((b) => b.id === contextMenu.buttonId);
			if (btn) {
				setEditingButton(btn);
				setModalOpen(true);
			}
		}
		setContextMenu(null);
	};

	const handleDelete = () => {
		if (contextMenu && confirm("Delete this command button?")) {
			setButtons(buttons.filter((b) => b.id !== contextMenu.buttonId));
		}
		setContextMenu(null);
	};

	return (
		<>
			<div id="sidebar">
				<div id="sidebar-header">
					<h2>Commands</h2>
					<button className="add-button" onClick={handleAddClick} type="button">
						+ Add
					</button>
				</div>
				<div id="button-list">
					{buttons.map((btn) => (
						<button
							key={btn.id}
							className="command-btn"
							onClick={() => onRunCommand(`${btn.command}\n`)}
							onContextMenu={(e) => handleContextMenu(e, btn.id)}
							type="button"
						>
							{btn.name}
						</button>
					))}
				</div>
			</div>

			<Modal
				isOpen={modalOpen}
				title={editingButton ? "Edit Command" : "Add Command"}
				initialName={editingButton?.name}
				initialCommand={editingButton?.command}
				onSave={handleSave}
				onClose={handleCloseModal}
			/>

			{contextMenu && (
				<ContextMenu
					x={contextMenu.x}
					y={contextMenu.y}
					onEdit={handleEdit}
					onDelete={handleDelete}
					onClose={() => setContextMenu(null)}
				/>
			)}
		</>
	);
}
