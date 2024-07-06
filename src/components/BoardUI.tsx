import { useRef, useState } from "react";
import { BitBoard, Board, Side, initAttacks } from "../utils/chess";
import { Chessground } from "chessground";
import "./chessground.base.css";
// import {Side} from "../utils/chess/constants"

import type { Api } from "chessground/api";
// import { initAttacks } from "../utils/chess/attacks";
import useEffectOnce from "../utils/useEffectOnce";
import { Key } from "chessground/types";
import { squareFromAlgebraic, squareToAlgebraic } from "../utils/chess/utils";
// import { bishopAttacks, bishopMasks, kingAttacks, knightAttacks, pawnAttacks, rookAttacks, rookMasks } from "../utils/chess/attacks";
// import type { Config } from 'chessground/config';

export default function BoardUI() {
	const [api, setApi] = useState<Api | null>(null);
	const [turn, setTurn] = useState<0 | 1>(Side.white);

	const ref = useRef<HTMLDivElement>(null);

	useEffectOnce(() => {
		const ds = Date.now();
		initAttacks();
		console.log("Init attacks took: ", Date.now() - ds);
		// console.log({
		// 	pawnAttacks,
		// 	kingAttacks,
		// 	bishopAttacks,
		// 	rookAttacks,
		// 	knightAttacks,
		// 	bishopMasks,
		// 	rookMasks,
		// });
	}, []);

	useEffectOnce(() => {
		// console.log(ref, ref.current, api);
		if (ref && ref.current && !api) {
			const board = Board.startingPosition();

			setTurn(board.turn);
			// let moves = board.generatePseudoLegalMoves();
			let moves = board.generateLegalMoves();

			let dests: Map<Key, Key[]> = new Map();

			moves.forEach((m) => {
				const from = squareToAlgebraic(m.from) as Key;
				const to = squareToAlgebraic(m.to) as Key;

				if (dests.get(from)) {
					dests.get(from)!.push(to);
				} else {
					dests.set(from, [to]);
				}
			});
			// const board = new BitBoard(0x0000001818000000n);
			// board.printBoard(true);
			// console.log(board.toFen());
			// console.log(board.printBoard({side: Side.white, useUnicodeCharacters: true, fillEmptySquares: false}));
			// board.blackPieces.printBoard(true);

			const afterMove = (orig: Key, dest: Key) => {
				const [from, to] = [squareFromAlgebraic(orig), squareFromAlgebraic(dest)];

				const move = moves.find((m) => m.from === from && m.to === to)!;

				board.makeMove(move, true);

				// moves = board.generatePseudoLegalMoves();
				moves = board.generateLegalMoves();
				console.log(moves);
				dests = new Map();

				moves.forEach((m) => {
					const from = squareToAlgebraic(m.from) as Key;
					const to = squareToAlgebraic(m.to) as Key;

					if (dests.get(from)) {
						dests.get(from)!.push(to);
					} else {
						dests.set(from, [to]);
					}
				});

				setTurn(board.turn);

				chessgroundApi.set({
					turnColor: board.turn === Side.white ? "white" : "black",
					fen: board.toFen(),
					premovable: { enabled: false },
					movable: {
						color: board.turn === Side.white ? "white" : "black",
						free: false,
						dests,
						events: {
							after: afterMove,
						},
					},
				});
			};

			const chessgroundApi = Chessground(ref.current, {
				orientation: "white",
				coordinates: true,
				turnColor: board.turn === Side.white ? "white" : "black",
				// coordinatesOnSquares: true,
				// animation: { enabled: true, duration: 200 },
				fen: board.toFen(),
				premovable: { enabled: false },
				movable: {
					color: board.turn === Side.white ? "white" : "black",
					free: false,
					dests,
					events: {
						after: afterMove,
					},
				},
			});
			// console.log(chessgroundApi);
			setApi(chessgroundApi);
		} else if (ref && ref.current && api) {
			api.set({});
		}
	}, [ref, api]);

	return (
		<>
			<span style={{ display: "block" }}>Turn: {turn ? "black" : "white"}</span>
			<div className="cg-cg">
					<div ref={ref} style={{ width: "700px", height: "700px" }}></div>
			</div>
			<input
				onChange={(e) => {
					const b = new BitBoard(BigInt(e.target.value));
					b.printBoard(true);
				}}
			></input>
		</>
	);
}
