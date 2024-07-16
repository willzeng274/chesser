import React from "react";
import { SquareValue } from "../../utils/types";
import { getTransformStyle } from "../../utils/utils";

const Piece = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { square: SquareValue; size: number }>(({ className, square, size, ...props }, ref) => {
	// add "dragging" if the piece is currently being dragged
	const cls = className;
	return (
		<cr-piece
            ref={ref}
			{...props}
			class={cls}
			style={{
				transform: getTransformStyle(square, size),
			}}
		/>
	);
});

export default Piece;
