import { useRef, useEffect, useCallback } from "react";

interface DividerProps {
	onResize: () => void;
}

export function Divider({ onResize }: DividerProps) {
	const isResizing = useRef(false);
	const sidebarRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		sidebarRef.current = document.getElementById("sidebar");

		// Restore saved width
		const savedWidth = localStorage.getItem("termos-sidebar-width");
		if (savedWidth && sidebarRef.current) {
			sidebarRef.current.style.width = savedWidth;
		}
	}, []);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isResizing.current || !sidebarRef.current) return;
			const newWidth = e.clientX;
			if (newWidth >= 100 && newWidth <= 500) {
				sidebarRef.current.style.width = `${newWidth}px`;
				onResize();
			}
		},
		[onResize],
	);

	const handleMouseUp = useCallback(() => {
		if (isResizing.current && sidebarRef.current) {
			isResizing.current = false;
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
			localStorage.setItem(
				"termos-sidebar-width",
				sidebarRef.current.style.width,
			);
		}
	}, []);

	useEffect(() => {
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [handleMouseMove, handleMouseUp]);

	const handleMouseDown = () => {
		isResizing.current = true;
		document.body.style.cursor = "col-resize";
		document.body.style.userSelect = "none";
	};

	return <div id="divider" onMouseDown={handleMouseDown} />;
}
