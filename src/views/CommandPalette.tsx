import { useState, useEffect, useRef, useMemo } from "react";
import styled from "styled-components";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { parseTemplateVariables } from "../utils/commandTemplate";

const Overlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	padding-top: 15vh;
	z-index: 3000;
`;

const PaletteContainer = styled.div`
	background: #1e1e1e;
	border: 1px solid #3d3d3d;
	border-radius: 8px;
	width: 90%;
	max-width: 500px;
	max-height: 400px;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
`;

const SearchInput = styled.input`
	background: #2d2d2d;
	border: none;
	border-bottom: 1px solid #3d3d3d;
	padding: 1rem 1.2rem;
	font-size: 1rem;
	color: #fff;
	outline: none;

	&::placeholder {
		color: #808080;
	}
`;

const CommandList = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: 0.5rem 0;
`;

const CommandItem = styled.div<{ $isActive: boolean }>`
	padding: 0.75rem 1.2rem;
	cursor: pointer;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: ${(props) => (props.$isActive ? "#2d2d2d" : "transparent")};

	&:hover {
		background: #2d2d2d;
	}
`;

const CommandName = styled.span`
	color: #fff;
	font-size: 0.95rem;
`;

const CommandText = styled.span`
	color: #808080;
	font-size: 0.8rem;
	max-width: 200px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const EmptyState = styled.div`
	padding: 2rem 1.2rem;
	text-align: center;
	color: #808080;
`;

const Hint = styled.div`
	padding: 0.5rem 1.2rem;
	border-top: 1px solid #3d3d3d;
	font-size: 0.75rem;
	color: #606060;
	display: flex;
	gap: 1rem;
`;

const HintKey = styled.kbd`
	background: #3d3d3d;
	padding: 0.1rem 0.4rem;
	border-radius: 3px;
	font-family: inherit;
`;

interface CommandButton {
	id: string;
	name: string;
	command: string;
}

interface CommandPaletteProps {
	isOpen: boolean;
	onClose: () => void;
	onRunCommand: (command: string) => void;
	onOpenParamModal: (button: CommandButton, variables: string[]) => void;
}

function fuzzyMatch(text: string, query: string): boolean {
	const lowerText = text.toLowerCase();
	const lowerQuery = query.toLowerCase();

	let queryIndex = 0;
	for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
		if (lowerText[i] === lowerQuery[queryIndex]) {
			queryIndex++;
		}
	}
	return queryIndex === lowerQuery.length;
}

export function CommandPalette({
	isOpen,
	onClose,
	onRunCommand,
	onOpenParamModal,
}: CommandPaletteProps) {
	const [buttons] = useLocalStorage<CommandButton[]>("termos-buttons", []);
	const [query, setQuery] = useState("");
	const [activeIndex, setActiveIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	const filteredCommands = useMemo(() => {
		if (!query.trim()) return buttons;
		return buttons.filter(
			(btn) => fuzzyMatch(btn.name, query) || fuzzyMatch(btn.command, query),
		);
	}, [buttons, query]);

	// Reset state when opening
	useEffect(() => {
		if (isOpen) {
			setQuery("");
			setActiveIndex(0);
			setTimeout(() => inputRef.current?.focus(), 0);
		}
	}, [isOpen]);

	// Reset active index when filtered results change
	useEffect(() => {
		setActiveIndex(0);
	}, [filteredCommands.length]);

	// Scroll active item into view
	useEffect(() => {
		if (listRef.current) {
			const activeItem = listRef.current.children[activeIndex] as HTMLElement;
			activeItem?.scrollIntoView({ block: "nearest" });
		}
	}, [activeIndex]);

	const executeCommand = (btn: CommandButton) => {
		const variables = parseTemplateVariables(btn.command);

		if (variables.length === 0) {
			onRunCommand(`${btn.command}\n`);
			onClose();
		} else {
			onOpenParamModal(btn, variables);
			onClose();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setActiveIndex((prev) =>
					prev < filteredCommands.length - 1 ? prev + 1 : prev,
				);
				break;
			case "ArrowUp":
				e.preventDefault();
				setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
				break;
			case "Enter":
				e.preventDefault();
				if (filteredCommands[activeIndex]) {
					executeCommand(filteredCommands[activeIndex]);
				}
				break;
			case "Escape":
				e.preventDefault();
				onClose();
				break;
		}
	};

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	console.log("CommandPalette render, isOpen:", isOpen);
	if (!isOpen) return null;

	return (
		<Overlay onClick={handleOverlayClick}>
			<PaletteContainer>
				<SearchInput
					ref={inputRef}
					type="text"
					placeholder="Search commands..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={handleKeyDown}
				/>
				<CommandList ref={listRef}>
					{filteredCommands.length > 0 ? (
						filteredCommands.map((btn, index) => (
							<CommandItem
								key={btn.id}
								$isActive={index === activeIndex}
								onClick={() => executeCommand(btn)}
								onMouseEnter={() => setActiveIndex(index)}
							>
								<CommandName>{btn.name}</CommandName>
								<CommandText>{btn.command}</CommandText>
							</CommandItem>
						))
					) : (
						<EmptyState>
							{buttons.length === 0
								? "No commands saved yet"
								: "No matching commands"}
						</EmptyState>
					)}
				</CommandList>
				<Hint>
					<span>
						<HintKey>↑↓</HintKey> Navigate
					</span>
					<span>
						<HintKey>Enter</HintKey> Execute
					</span>
					<span>
						<HintKey>Esc</HintKey> Close
					</span>
				</Hint>
			</PaletteContainer>
		</Overlay>
	);
}
