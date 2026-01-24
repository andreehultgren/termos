import type React from "react";
import styled, { css } from "styled-components";

type ButtonVariant =
	| "primary"
	| "secondary"
	| "command"
	| "closeTab"
	| "newTab";

type VariantRule = ReturnType<typeof css>;

type VariantStyle = {
	base: VariantRule;
	hover?: VariantRule;
};

const VARIANT_STYLES: Record<ButtonVariant, VariantStyle> = {
	primary: {
		base: css`
			background: #007acc;
			color: #fff;
		`,
		hover: css`
			background: #005a9e;
		`,
	},
	secondary: {
		base: css`
			background: #3d3d3d;
			color: #fff;
		`,
		hover: css`
			background: #4d4d4d;
		`,
	},
	command: {
		base: css`
			background: #3d3d3d;
			color: #fff;
			text-align: left;
		`,
		hover: css`
			background: #4d4d4d;
		`,
	},
	closeTab: {
		base: css`
			background: none;
			border: none;
			color: #888;
			font-size: 1.1rem;
			padding: 0 0.25rem;
			border-radius: 3px;
			line-height: 1;
			transition: background 0.2s ease, color 0.2s ease;
		`,
		hover: css`
			background: #4d4d4d;
			color: #fff;
		`,
	},
	newTab: {
		base: css`
			background: none;
			border: none;
			color: #888;
			font-size: 1.2rem;
			padding: 0 0.75rem;
			border-radius: 0;
			transition: background 0.2s ease, color 0.2s ease;
		`,
		hover: css`
			background: #3d3d3d;
			color: #fff;
		`,
	},
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
	${(props) => VARIANT_STYLES[props.$variant].base};

	${(props) =>
		VARIANT_STYLES[props.$variant].hover &&
		css`
			&:hover {
				${VARIANT_STYLES[props.$variant].hover}
			}
		`}
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
