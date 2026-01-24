import { useState, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import styled from "styled-components";
import { Modal } from "./Modal";
import { ContextMenu } from "./ContextMenu";
import { CommandParameterModal } from "./CommandParameterModal";
import {
	parseTemplateVariables,
	replaceTemplateVariables,
} from "../utils/commandTemplate";

const CommandButton = styled.button`
	width: 100%;
	padding: 0.6rem 0.8rem;
	margin-bottom: 0.4rem;
	background: #3d3d3d;
	color: #fff;
	border: none;
	border-radius: 4px;
	text-align: left;
	cursor: pointer;
	transition: background 0.2s;
	font-size: 0.9rem;
  &:hover{
    background: #4d4d4d;
  }
`;

const ButtonList = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: 0.5rem;

`;

const AddButton = styled.button`
  background: #007acc;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;


  &:hover {
    background: #005a9e;
  }
`;
const StyledSidebar = styled.div`
	width: 200px;
	background: #2d2d2d;
	color: #fff;
	display: flex;
	flex-direction: column;
	overflow: hidden;
`;

const SidebarHeader = styled.div`
	padding: 1rem;
	background: #252525;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1px solid #3d3d3d;

`;

const SidebarH2 = styled.div`
	font-size: 1rem;
	font-weight: 600;
`;

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
	const [paramModal, setParamModal] = useState<{
		isOpen: boolean;
		button: CommandButton | null;
		variables: string[];
	}>({ isOpen: false, button: null, variables: [] });

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

	const handleCommandClick = (btn: CommandButton) => {
		const variables = parseTemplateVariables(btn.command);

		if (variables.length === 0) {
			onRunCommand(`${btn.command}\n`);
		} else {
			setParamModal({ isOpen: true, button: btn, variables });
		}
	};

	const handleParamSubmit = (values: Record<string, string>) => {
		if (paramModal.button) {
			const finalCommand = replaceTemplateVariables(
				paramModal.button.command,
				values,
			);
			onRunCommand(`${finalCommand}\n`);
		}
		setParamModal({ isOpen: false, button: null, variables: [] });
	};

	const handleParamClose = () => {
		setParamModal({ isOpen: false, button: null, variables: [] });
	};

	return (
		<>
			<StyledSidebar>
				<SidebarHeader>
					<SidebarH2>Commands</SidebarH2>
					<AddButton onClick={handleAddClick} type="button">
						+ Add
					</AddButton>
				</SidebarHeader>
				<ButtonList>
					{buttons.map((btn) => (
						<CommandButton
							key={btn.id}
							onClick={() => handleCommandClick(btn)}
							onContextMenu={(e) => handleContextMenu(e, btn.id)}
							type="button"
						>
							{btn.name}
						</CommandButton>
					))}
				</ButtonList>
			</StyledSidebar>

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

			<CommandParameterModal
				isOpen={paramModal.isOpen}
				commandName={paramModal.button?.name ?? ""}
				variables={paramModal.variables}
				onSubmit={handleParamSubmit}
				onClose={handleParamClose}
			/>
		</>
	);
}
