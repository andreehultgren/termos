import type React from "react";
import styled from "styled-components";

type ButtonVariant = "primary" | "secondary";

const VARIANT_STYLES: Record<
	ButtonVariant,
	{ background: string; hover: string }
> = {
	primary: { background: "#007acc", hover: "#005a9e" },
	secondary: { background: "#3d3d3d", hover: "#4d4d4d" },
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
}

const StyledButton = styled.button<{ $variant: ButtonVariant }>`
	padding: 0.6rem 1.2rem;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 0.9rem;
	transition: background 0.2s;
	background: ${(props) => VARIANT_STYLES[props.$variant].background};
	color: #fff;

	&:hover {
		background: ${(props) => VARIANT_STYLES[props.$variant].hover};
	}
`;

export default function Button({
	variant = "primary",
	children,
	...rest
}: ButtonProps) {
	return (
		<StyledButton $variant={variant} {...rest}>
			{children}
		</StyledButton>
	);
}
