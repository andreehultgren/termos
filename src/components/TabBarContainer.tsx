import styled from "styled-components";

export default styled.div`
	display: flex;
	background: #252525;
	border-bottom: 1px solid #3d3d3d;
	min-height: 36px;
	align-items: stretch;
	overflow-x: auto;
	overflow-y: hidden;

	&::-webkit-scrollbar {
		height: 4px;
	}
`;
