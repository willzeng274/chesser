import { useCallback, useEffect, useRef, useState } from "react";

import "./chesser.css";

import { Board as ChessBoard } from "../../utils/chess";
import { classPieces, PieceType, Side } from "../../utils/chess/constants";
import { getLs1bIndex, squareFromAlgebraic, squareToAlgebraic } from "../../utils/chess/utils";
import { Attacks, initAttacksFromObject } from "../../utils/chess/attacks";
import { Move } from "../../utils/chess/move";

import useEffectOnce from "../../utils/useEffectOnce";
import { GameType, useGameStore } from "../../utils/stores";

import { checkSize, getTransformStyle, playAudioFile, playSound } from "../../utils/utils";
import { MouchEvent, SquareValue } from "../../utils/types";

import Debug from "./Debug";
import Coord from "./Coord";
import Piece from "./Piece";

const size = checkSize(1280, false) ? 750 : checkSize(1024, false) ? 600 : checkSize(768, true) ? 500 : checkSize(640, true) ? 400 : 300;

console.log("Size", size);

function onStart(
	boardRef: React.MutableRefObject<ChessBoard>,
	selectedRef: React.MutableRefObject<SquareValue | null>,
	timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
	isWhite: boolean,
	game: GameType,
	update: (turn: Side, move: Move) => void
) {
	// this is for multiple event listeners
	let abortController = new AbortController();
	return function (e: MouchEvent) {
		if (!e.isTrusted) return;
		if (e.buttons !== undefined && e.buttons > 1) return;
		if (e.touches && e.touches.length > 1) return;
		if (e.cancelable) e.preventDefault();

		abortController.abort();

		abortController = new AbortController();

		const boardPos = (e.target as HTMLElement).getBoundingClientRect();
		const x = (e.clientX ?? e.touches![0].clientX) - boardPos.left;
		const y = (e.clientY ?? e.touches![0].clientY) - boardPos.top;

		const file = Math.ceil(x / (size / 8));
		const rank = 9 - Math.ceil(y / (size / 8));

		const square = isWhite ? (8 - rank) * 8 + file - 1 : 63 - ((8 - rank) * 8 + file - 1);

		if (square >= 64n || square < 0n) return;

		const selectedPiece = boardRef.current.getPieceInSquare(BigInt(square));

		document.querySelectorAll(".move-dest, .selected").forEach((e) => e.remove());
		// console.log("called [pc] [sq]", selectedPiece, square);

		// if (selectedPiece !== null) console.log("CURRENT SELECTED PIECE", selectedPiece, asciiPieces[selectedPiece!]);

		if (
			selectedPiece !== null &&
			PieceType.side(selectedPiece) === boardRef.current.turn &&
			!(game !== GameType.sandbox && boardRef.current.turn !== (isWhite ? Side.white : Side.black))
		) {
			const new_piece = document.getElementById(`crpc-${square}`)!;
			const ghost_piece = document.createElement("cr-piece");

			ghost_piece.style.height = `${size / 8}px`;
			ghost_piece.style.width = `${size / 8}px`;
			ghost_piece.className = classPieces[selectedPiece] + " ghost";
			ghost_piece.style.transform = getTransformStyle((isWhite ? square : 63 - square) as SquareValue, size);

			document.querySelector("cr-container")?.appendChild(ghost_piece);

			new_piece.style.height = `${size / 8}px`;
			new_piece.style.width = `${size / 8}px`;
			new_piece.className = classPieces[selectedPiece] + " dragging";

			const onMove = (e: MouchEvent) => {
				const boardPos = document.querySelector("cr-board")!.getBoundingClientRect();
				const x = (e.clientX ?? e.touches![0].clientX) - boardPos.left - size / 16;
				const y = (e.clientY ?? e.touches![0].clientY) - boardPos.top - size / 16;

				new_piece.style.transform = `translate(${x}px, ${y}px)`;
			};

			document.addEventListener("mousemove", onMove);
			document.addEventListener("touchmove", onMove, { passive: false });

			const onUp = (ev: MouchEvent) => {
				document.removeEventListener("mousemove", onMove);
				document.removeEventListener("touchmove", onMove);
				new_piece.className = classPieces[selectedPiece];
				new_piece.style.transform = getTransformStyle((isWhite ? square : 63 - square) as SquareValue, size);
				ghost_piece.remove();
				document.removeEventListener("mouseup", onUp);
				document.removeEventListener("touchend", onUp);

				const boardPos = (e.target as HTMLElement).getBoundingClientRect();
				const x = (ev.clientX ?? ev.changedTouches![0].clientX) - boardPos.left;
				const y = (ev.clientY ?? ev.changedTouches![0].clientY) - boardPos.top;

				const file = Math.ceil(x / (size / 8));
				const rank = 9 - Math.ceil(y / (size / 8));

				const square_ = isWhite ? (8 - rank) * 8 + file - 1 : 63 - ((8 - rank) * 8 + file - 1);

				// console.log(square, file, rank);

				// console.log(square_);

				if (selectedRef.current === square_) {
					// deselect
					selectedRef.current = null;
					document.querySelectorAll(".move-dest, .selected").forEach((e) => e.remove());
					return;
				}

				// doesn't work, plays sound on legal moves lol
				// if (boardRef.current.getPieceInSquare(BigInt(square_)) === null) {
				// 	const audio = new Audio("/sound/illegal.mp3");
				// 	audio.play();
				// }

				selectedRef.current = square as SquareValue;
			};

			document.addEventListener("mouseup", onUp);
			document.addEventListener("touchend", onUp, { passive: false });

			const pieceMoves = boardRef.current.legalMoves.filter((m) => m.from === BigInt(square));

			if (pieceMoves.length > 0) {
				const elem = document.createElement("cr-square");
				elem.className = "selected";

				elem.style.transform = getTransformStyle((isWhite ? square : 63 - square) as SquareValue, size);
				(e.target! as HTMLElement).insertBefore(elem, (e.target as HTMLElement).firstChild);
			}

			pieceMoves.forEach((m) => {
				const elem = document.createElement("cr-square");
				elem.className = "move-dest";

				const to = (isWhite ? Number(m.to) : 63 - Number(m.to)) as SquareValue;
				const from = (isWhite ? Number(m.from) : 63 - Number(m.from)) as SquareValue;

				elem.style.transform = getTransformStyle(to, size);

				const drop = () => {
					console.log("drop event");
					document.querySelectorAll(".move-dest, .selected, .last-move, .check").forEach((e) => e.remove());
					const elem = document.createElement("cr-square");
					elem.className = "last-move";
					const elem_ = elem.cloneNode() as HTMLElement;
					elem.style.transform = getTransformStyle(from, size);
					const transformTo = getTransformStyle(to, size);
					elem_.style.transform = transformTo;
					(e.target! as HTMLElement).insertBefore(elem, (e.target as HTMLElement).firstChild);
					(e.target! as HTMLElement).insertBefore(elem_, (e.target as HTMLElement).firstChild);
					console.log("mouse is down");

					boardRef.current.makeMove(m, true);
					// playSound(m.flags);
					console.log("TURN", boardRef.current.turn);
					boardRef.current.legalMoves = boardRef.current.generateLegalMoves();

					if (game !== GameType.sandbox && boardRef.current.turn === (isWhite ? Side.white : Side.black)) {
						return;
					}

					// console.log("Check", boardRef.current.isCheck);

					if (boardRef.current.isCheck && boardRef.current.legalMoves.length === 0) {
						playAudioFile("game-end");
					} else if (boardRef.current.legalMoves.length === 0) {
						playAudioFile("game-end");
					}

					if (boardRef.current.isCheck) {
						playAudioFile("move-check");
						const pos = Number(
							getLs1bIndex(
								boardRef.current.turn === Side.white
									? boardRef.current.pieceBitBoards.get(PieceType.wKing)!.value
									: boardRef.current.pieceBitBoards.get(PieceType.bKing)!.value
							)
						) as SquareValue;

						const elem = document.createElement("cr-square");
						elem.className = "check";
						elem.style.transform = getTransformStyle(isWhite ? pos : ((63 - pos) as SquareValue), size);
						(e.target! as HTMLElement).insertBefore(elem, (e.target as HTMLElement).firstChild);
					}

					// animate before updating
					// this has no issues because we updated boardRef already... so the actual state is up to date
					new_piece.animate([{ transform: new_piece.style.transform }, { transform: transformTo }], {
						duration: 200,
						fill: "forwards",
						easing: "ease-in-out",
					});
					// update
					// store tm in
					if (timeoutRef.current) clearTimeout(timeoutRef.current);
					timeoutRef.current = setTimeout(() => update(boardRef.current.turn, m), 200);
				};

				elem.addEventListener("mousedown", drop);
				// the mobile user might not want to move there... let's wait until touchend
				// elem.addEventListener("touchstart", drop);

				elem.addEventListener("mouseup", drop);
				elem.addEventListener("touchend", drop, { passive: false });

				const board = document.querySelector("cr-board") as HTMLElement;

				if (e.touches && board) {
					// console.log("touch moving rn");
					const dropBoard = (e: TouchEvent) => {
						// console.log("drop board event");
						if (!e.isTrusted) return;
						if (e.touches && e.touches.length > 1) return;
						e.preventDefault();

						const boardPos = board.getBoundingClientRect();
						const x = e.changedTouches![0].clientX - boardPos.left;
						const y = e.changedTouches![0].clientY - boardPos.top;

						const file = Math.ceil(x / (size / 8));
						const rank = 9 - Math.ceil(y / (size / 8));

						const square = isWhite ? (8 - rank) * 8 + file - 1 : 63 - ((8 - rank) * 8 + file - 1);

						// const selectedPiece = boardRef.current.getPieceInSquare(BigInt(square));

						if (square === to) {
							drop();
							// board.removeEventListener("touchend", dropBoard);
							abortController.abort();
						}
					};
					board.addEventListener("touchend", dropBoard, { passive: false, signal: abortController.signal });
				}

				(e.target! as HTMLElement).insertBefore(elem, (e.target as HTMLElement).firstChild);
			});
		}
	};
}

interface BoardUIProps {
	attacks: Attacks;
}

export default function Board({ attacks }: BoardUIProps) {
	initAttacksFromObject(attacks);

	const ws = useGameStore((state) => state.ws);
	const isWhite = useGameStore((state) => state.isWhite);
	const game = useGameStore((state) => state.gameType);

	const setGame = useGameStore((state) => state.setGame);

	const ref = useRef<HTMLElement>(null);

	const boardRef = useRef<ChessBoard>(ChessBoard.startingPosition());

	useEffectOnce(() => {
		boardRef.current.legalMoves = boardRef.current.generateLegalMoves();
	}, []);
	// const boardRef = useRef<ChessBoard>(ChessBoard.fromFen("1KR5/1PPBN3/3P4/4P3/4p3/1pn1qp2/pb1pn2Q/1k6 w - - 0 1"));

	const selectedRef = useRef<SquareValue | null>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const squaresRef = useRef<(HTMLDivElement | null)[]>(Array(64));

	const [boardUpdate, setBoardUpdate] = useState<boolean>(false);
	const [turn, setTurn] = useState<Side>(Side.white);
	const [moves, setMoves] = useState<string[][]>([]);

	useEffect(() => {
		const handler = (e: MessageEvent) => {
			e.data.text().then((t: string) => {
				const evt = JSON.parse(t);
				// console.log(evt);
				if (evt.type === "move") {
					const squareFrom = evt.data.from as SquareValue;
					const squareTo = evt.data.to as SquareValue;

					const move = boardRef.current.legalMoves.find((m) => m.from === BigInt(squareFrom) && m.to === BigInt(squareTo))!;

					// console.log(boardRef.current.legalMoves, move);

					const new_piece = document.getElementById(`crpc-${squareFrom}`)!;

					document.querySelectorAll(".move-dest, .selected, .last-move, .check").forEach((e) => e.remove());
					const crBoard = document.querySelector("cr-board")!;
					const elem = document.createElement("cr-square");
					elem.className = "last-move";
					const elem_ = elem.cloneNode() as HTMLElement;
					elem.style.transform = getTransformStyle(isWhite ? squareFrom : ((63 - squareFrom) as SquareValue), size);
					const transformTo = getTransformStyle(isWhite ? squareTo : ((63 - squareTo) as SquareValue), size);
					elem_.style.transform = transformTo;
					crBoard.insertBefore(elem, crBoard.firstChild);
					crBoard.insertBefore(elem_, crBoard.firstChild);
					// console.log("mouse is down");

					boardRef.current.makeMove(move, true);
					boardRef.current.legalMoves = boardRef.current.generateLegalMoves();

					// console.log("Check", boardRef.current.isCheck);

					if (boardRef.current.isCheck && boardRef.current.legalMoves.length === 0) {
						const audio = new Audio("/sound/game-end.mp3");
						audio.play();
					} else if (boardRef.current.legalMoves.length === 0) {
						const audio = new Audio("/sound/game-end.mp3");
						audio.play();
					}

					if (boardRef.current.isCheck) {
						const audio = new Audio("/sound/move-check.mp3");
						audio.play();
						// console.log("Check at square", Number(getLs1bIndex(boardRef.current.turn === Side.white
						// 	? boardRef.current.pieceBitBoards.get(PieceType.wKing)!.value
						// 	: boardRef.current.pieceBitBoards.get(PieceType.bKing)!.value)) as SquareValue);
						const pos = Number(
							getLs1bIndex(
								boardRef.current.turn === Side.white
									? boardRef.current.pieceBitBoards.get(PieceType.wKing)!.value
									: boardRef.current.pieceBitBoards.get(PieceType.bKing)!.value
							)
						) as SquareValue;

						const elem = document.createElement("cr-square");
						elem.className = "check";
						elem.style.transform = getTransformStyle(isWhite ? pos : ((63 - pos) as SquareValue), size);
						crBoard.insertBefore(elem, crBoard.firstChild);
					}

					// animate before updating
					new_piece.animate([{ transform: new_piece.style.transform }, { transform: transformTo }], {
						duration: 200,
						fill: "forwards",
						easing: "ease-in-out",
					});
					// update
					// store tm in
					if (timeoutRef.current) clearTimeout(timeoutRef.current);
					timeoutRef.current = setTimeout(() => update(boardRef.current.turn, move), 200);
				}
			});
		};
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.addEventListener("message", handler);
		}
		return () => ws?.removeEventListener("message", handler);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ws, isWhite]);

	const nextStockfish = useCallback(
		() =>
			fetch(import.meta.env.PROD ? "https://chesser-backend.wzeng.dev" : "/api/", {
				method: "POST",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					fen: boardRef.current.toFen(),
				}),
			})
				.then((res) => res.json())
				.then((res) => {
					// res.from, res.to, res.promotion;
					console.log(res);

					const from = squareFromAlgebraic(res.from)!,
						to = squareFromAlgebraic(res.to)!;

					const squareFrom = Number(from) as SquareValue;
					const squareTo = Number(to) as SquareValue;

					const move = boardRef.current.legalMoves.find((m) => m.from === from && m.to === to)!;

					// console.log(boardRef.current.legalMoves, move);

					const new_piece = document.getElementById(`crpc-${from}`)!;

					document.querySelectorAll(".move-dest, .selected, .last-move, .check").forEach((e) => e.remove());
					const crBoard = document.querySelector("cr-board")!;
					const elem = document.createElement("cr-square");
					elem.className = "last-move";
					const elem_ = elem.cloneNode() as HTMLElement;
					elem.style.transform = getTransformStyle(isWhite ? squareFrom : ((63 - squareFrom) as SquareValue), size);
					const transformTo = getTransformStyle(isWhite ? squareTo : ((63 - squareTo) as SquareValue), size);
					elem_.style.transform = transformTo;
					crBoard.insertBefore(elem, crBoard.firstChild);
					crBoard.insertBefore(elem_, crBoard.firstChild);
					// console.log("mouse is down");

					boardRef.current.makeMove(move, true);
					boardRef.current.legalMoves = boardRef.current.generateLegalMoves();

					// console.log("Check", boardRef.current.isCheck);

					if (boardRef.current.isCheck && boardRef.current.legalMoves.length === 0) {
						const audio = new Audio("/sound/game-end.mp3");
						audio.play();
					} else if (boardRef.current.legalMoves.length === 0) {
						const audio = new Audio("/sound/game-end.mp3");
						audio.play();
					}

					if (boardRef.current.isCheck) {
						const audio = new Audio("/sound/move-check.mp3");
						audio.play();
						// console.log("Check at square", Number(getLs1bIndex(boardRef.current.turn === Side.white
						// 	? boardRef.current.pieceBitBoards.get(PieceType.wKing)!.value
						// 	: boardRef.current.pieceBitBoards.get(PieceType.bKing)!.value)) as SquareValue);
						const pos = Number(
							getLs1bIndex(
								boardRef.current.turn === Side.white
									? boardRef.current.pieceBitBoards.get(PieceType.wKing)!.value
									: boardRef.current.pieceBitBoards.get(PieceType.bKing)!.value
							)
						) as SquareValue;

						const elem = document.createElement("cr-square");
						elem.className = "check";
						elem.style.transform = getTransformStyle(isWhite ? pos : ((63 - pos) as SquareValue), size);
						crBoard.insertBefore(elem, crBoard.firstChild);
					}

					// animate before updating
					new_piece.animate([{ transform: new_piece.style.transform }, { transform: transformTo }], {
						duration: 200,
						fill: "forwards",
						easing: "ease-in-out",
					});
					// update
					// store tm in
					if (timeoutRef.current) clearTimeout(timeoutRef.current);
					timeoutRef.current = setTimeout(() => update(boardRef.current.turn, move), 200);
				}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[isWhite]
	);

	const update = useCallback(
		(turn: Side, move: Move) => {
			console.log("update");
			// setIsWhite(w => !w);
			// turns are flipped
			playSound(isWhite ? turn === Side.black : turn === Side.white, move.flags);
			setBoardUpdate((u) => !u);
			setTurn(turn);
			setMoves((moves) => {
				// meaning it was white to move
				if (turn === Side.black) {
					return [...moves, [squareToAlgebraic(move.from) + squareToAlgebraic(move.to)]];
				} else {
					const new_ = [...moves];
					// console.log("new", new_, new_[new_.length - 1]);
					new_[new_.length - 1] = [...new_[new_.length - 1], squareToAlgebraic(move.from) + squareToAlgebraic(move.to)];
					// console.log("after", new_, new_[new_.length - 1]);
					return new_;
				}
			});
			// console.log(game, ws);
			if (game === GameType.stockfish && (isWhite ? turn === Side.black : turn === Side.white)) {
				nextStockfish();
			} else if (game === GameType.multiplayer && (isWhite ? turn === Side.black : turn === Side.white) && ws) {
				// ws
				ws.send(
					JSON.stringify({
						type: "move",
						data: {
							from: Number(move.from),
							to: Number(move.to),
						},
					})
				);
			}
		},
		[isWhite, game, nextStockfish, ws]
	);

	useEffect(() => {
		const fn = onStart(boardRef, selectedRef, timeoutRef, isWhite, game, update);
		if (ref && ref.current) {
			ref.current.addEventListener("touchstart", fn, {
				passive: false,
			});
			ref.current.addEventListener("mousedown", fn, {
				passive: false,
			});
		}
		const current = ref.current;
		return () => {
			current?.removeEventListener("touchstart", fn);
			current?.removeEventListener("mousedown", fn);
		};
	}, [boardRef, isWhite, update, game]);

	useEffectOnce(() => {
		if (game === GameType.stockfish && !isWhite) {
			nextStockfish();
		}
	}, [game, isWhite]);

	return (
		<div className="w-full h-full flex flex-col sm:flex-row items-center justify-center bg-gradient-to-r from-blue-200 to-cyan-200 gap-4 sm:gap-10">
			<div
				className="cr-cr"
				style={{
					border: `${size / 30}px solid transparent`,
					borderImage: `url("/wood_texture.jpg") 64`,
				}}
			>
				<div
					className={`cr-wrap ${isWhite ? "orientation-white" : "orientation-black"} manipulable`}
					style={{ width: `${size}px`, height: `${size}px` }}
				>
					<cr-container style={{ width: `${size}px`, height: `${size}px` }}>
						<cr-board class="touch-none" ref={ref}>
							{Array.from({ length: 64 }, (_, index) => {
								// so it is reactive
								boardUpdate;

								const square = isWhite ? index : 63 - index;

								const piece = boardRef.current.getPieceInSquare(BigInt(square));

								// console.log(piece);

								if (piece !== null && piece !== undefined) {
									// const isKingChecked = (piece === PieceType.wKing || piece === PieceType.bKing) && boardRef.current?.isCheck;
									const className = classPieces[piece];
									//  + ' ' + (isKingChecked ? 'check' : '');
									return (
										<Piece
											key={square}
											className={className}
											id={`crpc-${square}`}
											square={index as SquareValue}
											size={size}
											ref={(el) => (squaresRef.current[index] = el)}
										/>
									);
								}
							})}
						</cr-board>
					</cr-container>
					<cr-coords class="ranks">
						{Array.from({ length: 8 }, (_, i) => (
							<Coord key={i} size={size} style={{ top: `${i * 12.5}%` }}>
								{isWhite ? 8 - i : i + 1}
							</Coord>
						))}
					</cr-coords>
					<cr-coords class="files">
						{Array.from({ length: 8 }, (_, i) => (
							<Coord key={i} size={size} style={{ left: `${i * 12.5}%` }}>
								{String.fromCharCode((isWhite ? i : 7 - i) + "a".charCodeAt(0))}
							</Coord>
						))}
					</cr-coords>
				</div>
			</div>
			<div className="flex flex-col w-60 text-center gap-y-2" style={{ height: size + size / 15 }}>
				<div className="flex-grow rounded-md bg-gradient-to-br from-slate-700/80 to-gray-500/80 overflow-y-auto">
					<p className="w-full text-center p-2 text-white bg-slate-800/80 rounded-t-md">Moves</p>
					{moves.map((mv, ind) => (
						<div className="flex flex-row text-white" key={ind}>
							<div className="w-8 bg-slate-500/90">{ind + 1}</div>
							<div className="flex-grow flex flex-row">
								<div className="px-1 w-1/2 text-start hover:bg-blue-400">{mv[0]}</div>
								{mv[1] && <div className="px-1 w-1/2 text-start hover:bg-blue-400">{mv[1]}</div>}
							</div>
						</div>
					))}
				</div>
				<span className="block">Turn: {turn ? "black" : "white"}</span>
				<span className="block">
					{isWhite ? (turn ? "Waiting for opponent..." : "Your turn") : turn ? "Your turn" : "Waiting for opponent..."}
				</span>
				<button
					className="z-10 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-black text-white hover:bg-black/80 h-10 px-4 py-2"
					onClick={() => setGame(GameType.undefined)}
				>
					Exit
				</button>
			</div>
			<Debug />
		</div>
	);
}
