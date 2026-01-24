import { useState, useEffect, useRef } from "react";
import ModalOverlay from "./ModalOverlay";
import ModalContainer from "./ModalContainer";
import FormGroup from "./FormGroup";
import ModalActions from "./ModalActions";
import Button from "./Button";
import FormLabel from "./FormLabel";
import FormInput from "./FormInput";

interface CommandParameterModalProps {
	isOpen: boolean;
	commandName: string;
	variables: string[];
	onSubmit: (values: Record<string, string>) => void;
	onClose: () => void;
}

export function CommandParameterModal({
	isOpen,
	commandName,
	variables,
	onSubmit,
	onClose,
}: CommandParameterModalProps) {
	const [formValues, setFormValues] = useState<Record<string, string>>({});
	const firstInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isOpen) {
			const initialValues: Record<string, string> = {};
			for (const v of variables) {
				initialValues[v] = "";
			}
			setFormValues(initialValues);
			setTimeout(() => firstInputRef.current?.focus(), 0);
		}
	}, [isOpen, variables]);

	const handleChange = (varName: string, value: string) => {
		setFormValues((prev) => ({ ...prev, [varName]: value }));
	};

	const handleSubmit = () => {
		onSubmit(formValues);
	};

	const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
		if (e.key === "Enter") {
			if (index === variables.length - 1) {
				handleSubmit();
			} else {
				const nextInput = document.getElementById(`param-input-${index + 1}`);
				nextInput?.focus();
			}
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
				<h3>Run: {commandName}</h3>
				<p>Enter values for the parameters:</p>
				{variables.map((varName, index) => (
					<FormGroup key={varName}>
						<FormLabel htmlFor={`param-input-${index}`}>{varName}</FormLabel>
						<FormInput
							id={`param-input-${index}`}
							ref={index === 0 ? firstInputRef : undefined}
							type="text"
							value={formValues[varName] ?? ""}
							onChange={(e) => handleChange(varName, e.target.value)}
							onKeyDown={(e) => handleKeyDown(e, index)}
							placeholder={`Enter ${varName}`}
						/>
					</FormGroup>
				))}
				<ModalActions>
					<Button variant="primary" onClick={handleSubmit} type="button">
						Run
					</Button>
					<Button variant="secondary" onClick={onClose} type="button">
						Cancel
					</Button>
				</ModalActions>
			</ModalContainer>
		</ModalOverlay>
	);
}
