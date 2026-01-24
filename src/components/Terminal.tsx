import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import styled from "styled-components";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

const TerminalInstance = styled.div<{ $visible: boolean }>`
  width: 100%;
  height: 100%;
  padding: 0.5rem;
  display: ${(props) => (props.$visible ? "block" : "none")};
`;

export interface TerminalHandle {
	write: (data: string) => void;
	fit: () => void;
	focus: () => void;
	getSize: () => { cols: number; rows: number };
}

interface TerminalProps {
	onData: (data: string) => void;
	visible: boolean;
}

export const Terminal = forwardRef<TerminalHandle, TerminalProps>(
	({ onData, visible }, ref) => {
		const containerRef = useRef<HTMLDivElement>(null);
		const terminalRef = useRef<XTerm | null>(null);
		const fitAddonRef = useRef<FitAddon | null>(null);

		useEffect(() => {
			if (!containerRef.current) return;

			const term = new XTerm({
				cursorBlink: true,
				theme: {
					background: "#1e1e1e",
					foreground: "#d4d4d4",
				},
			});

			const fitAddon = new FitAddon();
			term.loadAddon(fitAddon);
			term.open(containerRef.current);

			term.onData(onData);

			terminalRef.current = term;
			fitAddonRef.current = fitAddon;

			// Initial fit
			setTimeout(() => fitAddon.fit(), 10);

			return () => {
				term.dispose();
			};
		}, [onData]);

		useEffect(() => {
			if (visible && fitAddonRef.current) {
				setTimeout(() => {
					fitAddonRef.current?.fit();
					terminalRef.current?.focus();
				}, 10);
			}
		}, [visible]);

		useImperativeHandle(ref, () => ({
			write: (data: string) => terminalRef.current?.write(data),
			fit: () => fitAddonRef.current?.fit(),
			focus: () => terminalRef.current?.focus(),
			getSize: () => ({
				cols: terminalRef.current?.cols ?? 80,
				rows: terminalRef.current?.rows ?? 24,
			}),
		}));

		return <TerminalInstance ref={containerRef} $visible={visible} />;
	},
);

Terminal.displayName = "Terminal";
