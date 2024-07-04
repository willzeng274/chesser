import { useEffect, useRef, useState } from "react";
import { Board } from "../utils/chess";
import { Chessground } from "chessground";
import "./chessground.base.css";
// import {Side} from "../utils/chess/constants"

import type { Api } from "chessground/api";
// import type { Config } from 'chessground/config';

export default function BoardUI() {
	const [api, setApi] = useState<Api | null>(null);

	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		console.log(ref, ref.current, api);
		if (ref && ref.current && !api) {
			const board = Board.startingPosition();
			// const board = new BitBoard(0x0000001818000000n);
			// board.printBoard(true);
			// console.log(board.toFen());
			// console.log(board.printBoard({side: Side.white, useUnicodeCharacters: true, fillEmptySquares: false}));
			// board.blackPieces.printBoard(true);

			const chessgroundApi = Chessground(ref.current, {
				orientation: "black",
				coordinatesOnSquares: true,
				// animation: { enabled: true, duration: 200 },
				fen: board.toFen(),
			});
			console.log(chessgroundApi);
			setApi(chessgroundApi);
		} else if (ref && ref.current && api) {
			api.set({});
		}
	}, [ref]);

	return <div ref={ref} style={{ width: "500px", height: "500px" }}></div>;
}
