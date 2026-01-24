import { useState, useEffect, useRef } from "react";
import ModalOverlay from "./ModalOverlay";
import ModalContainer from "./ModalContainer";

interface ModalProps {
	isOpen: boolean;
	title: string;
	initialName?: string;
	initialCommand?: string;
	onSave: (name: string, command: string) => void;
	onClose: () => void;
}

export function Modal({
	isOpen,
	title,
	initialName = "",
	initialCommand = "",
	onSave,
	onClose,
}: ModalProps) {
	const [name, setName] = useState(initialName);
	const [command, setCommand] = useState(initialCommand);
	const nameInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setName(initialName);
		setCommand(initialCommand);
	}, [initialName, initialCommand]);

	useEffect(() => {
		if (isOpen) {
			nameInputRef.current?.focus();
		}
	}, [isOpen]);

	const handleSave = () => {
		if (name.trim() && command.trim()) {
			onSave(name.trim(), command.trim());
		}
	};

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	if (!isOpen) return null;

	return (
		<ModalOverlay onMouseUp={handleOverlayClick}>
			<ModalContainer>
				<h3>{title}</h3>
				<div className="form-group">
					<p>Name:</p>
					<input
						ref={nameInputRef}
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="e.g., Build Project"
						onKeyDown={(e) =>
							e.key === "Enter" && document.getElementById("cmd-input")?.focus()
						}
					/>
				</div>
				<div className="form-group">
					<p>Command:</p>

					<input
						id="cmd-input"
						type="text"
						value={command}
						onChange={(e) => setCommand(e.target.value)}
						placeholder="e.g., npm run build"
						onKeyDown={(e) => e.key === "Enter" && handleSave()}
					/>
					<p className="info-text">
						If you want parameters, add {"{{variable_name}}"} to the command.
					</p>
				</div>
				<div className="modal-actions">
					<button className="btn-primary" onClick={handleSave} type="button">
						Save
					</button>
					<button className="btn-secondary" onClick={onClose} type="button">
						Cancel
					</button>
				</div>
			</ModalContainer>
		</ModalOverlay>
	);
}
