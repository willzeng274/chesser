import { useCallback, useEffect, useRef, useState } from "react";
import "./chesser.css";
import { Board, initAttacks, Squares } from "../utils/chess";
import { classPieces, PieceType, Side } from "../utils/chess/constants";
import { getLs1bIndex } from "../utils/chess/utils";
import { MoveFlags } from "../utils/chess/move";
import useEffectOnce from "../utils/useEffectOnce";

type MouchEvent = Event & Partial<MouseEvent & TouchEvent>;

const size = 700;

type SquareValue = (typeof Squares)[keyof typeof Squares];

function Piece({ className, square, size, ...props }: React.HTMLAttributes<HTMLDivElement> & { square: SquareValue; size: number }) {
	// add "dragging" if the piece is currently being dragged
	const cls = className;
	return (
		<cr-piece
			class={cls}
			style={{
				transform: getTransformStyle(square, size),
			}}
			onClick={() => console.log(cls)}
			{...props}
		/>
	);
}

function playSound(isSelf: boolean, flag: number) {
	switch (flag) {
		case MoveFlags.quiet:
		case MoveFlags.doublePush:
		case MoveFlags.enPassant: {
			// console.log(isSelf ? "/sound/move-self.mp3" : "/sound/move-opponent.mp3");
			const audio = new Audio(isSelf ? "/sound/move-self.mp3" : "/sound/move-opponent.mp3");
			audio.play();
			break;
		}
		case MoveFlags.capture: {
			const audio = new Audio("/sound/capture.mp3");
			audio.play();
			break;
		}
		case MoveFlags.kingSideCastle:
		case MoveFlags.queenSideCastle: {
			const audio = new Audio("/sound/castle.mp3");
			audio.play();
			break;
		}
		case MoveFlags.promotionCapture: {
			const audio = new Audio("/sound/promote.mp3");
			audio.play();
			break;
		}
	}
}

const getTransformStyle = (square: SquareValue, size: number) => {
	const x = square % 8;
	const y = Math.floor(square / 8);
	const percentX = size * (x / 8);
	const percentY = size * (y / 8);
	return `translate(${percentX}px, ${percentY}px)`;
};


function onStart(
	boardRef: React.MutableRefObject<Board>,
	selectedRef: React.MutableRefObject<SquareValue | null>,
	timeoutRef: React.MutableRefObject<number | null>,
	isWhite: boolean,
	update: (turn: Side, flags: number) => void
) {
	return function (e: MouchEvent) {
		if (!e.isTrusted) return;
		if (e.buttons !== undefined && e.buttons > 1) return;
		if (e.touches && e.touches.length > 1) return;
		e.preventDefault();

		const boardPos = (e.target as HTMLElement).getBoundingClientRect();
		const x = (e.clientX ?? e.touches![0].clientX) - boardPos.left;
		const y = (e.clientY ?? e.touches![0].clientY) - boardPos.top;

		const file = Math.ceil(x / (size / 8));
		const rank = 9 - Math.ceil(y / (size / 8));

		const square = isWhite ? (8 - rank) * 8 + file - 1 : 63 - ((8 - rank) * 8 + file - 1);

		const selectedPiece = boardRef.current.getPieceInSquare(BigInt(square));

		document.querySelectorAll(".move-dest, .selected").forEach((e) => e.remove());
		console.log("called [pc] [sq]", selectedPiece, square);

		// if (selectedPiece !== null) console.log("CURRENT SELECTED PIECE", selectedPiece, asciiPieces[selectedPiece!]);

		if (selectedPiece !== null && PieceType.side(selectedPiece) === boardRef.current.turn) {
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

			const onMove = (e: MouseEvent) => {
				const boardPos = document.querySelector("cr-board")!.getBoundingClientRect();
				const x = e.clientX - boardPos.left - size / 16;
				const y = e.clientY - boardPos.top - size / 16;

				new_piece.style.transform = `translate(${x}px, ${y}px)`;
			};

			document.addEventListener("mousemove", onMove);

			const onUp = (ev: MouchEvent) => {
				document.removeEventListener("mousemove", onMove);
				new_piece.className = classPieces[selectedPiece];
				new_piece.style.transform = getTransformStyle((isWhite ? square : 63 - square) as SquareValue, size);
				ghost_piece.remove();
				document.removeEventListener("mouseup", onUp);

				const boardPos = (e.target as HTMLElement).getBoundingClientRect();
				const x = (ev.clientX ?? ev.touches![0].clientX) - boardPos.left;
				const y = (ev.clientY ?? ev.touches![0].clientY) - boardPos.top;

				const file = Math.ceil(x / (size / 8));
				const rank = 9 - Math.ceil(y / (size / 8));

				const square_ = isWhite ? (8 - rank) * 8 + file - 1 : 63 - ((8 - rank) * 8 + file - 1);

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
						(e.target! as HTMLElement).insertBefore(elem, (e.target as HTMLElement).firstChild);
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
					timeoutRef.current = setTimeout(() => update(boardRef.current.turn, m.flags), 200);
				};

				elem.addEventListener("mousedown", drop);

				elem.addEventListener("mouseup", drop);

				(e.target! as HTMLElement).insertBefore(elem, (e.target as HTMLElement).firstChild);
			});
		}
	};
}

// function getSquareFromFileAndRank(x: number, y: number) {
//     return y*8 + x;
// }

const ds = Date.now();
initAttacks();
console.log("Init attacks took: ", Date.now() - ds);

export default function BoardUI() {
	const ref = useRef<HTMLElement>(null);

	const boardRef = useRef<Board>(Board.startingPosition());
	const selectedRef = useRef<SquareValue | null>(null);
	const timeoutRef = useRef<number | null>(null);

	const [boardUpdate, setBoardUpdate] = useState<boolean>(false);
	// const [isWhite, setIsWhite] = useState<boolean>(true);
	const [turn, setTurn] = useState<Side>(Side.white);

	const isWhite = false;

	const update = useCallback((turn: Side, flags: number) => {
		// setIsWhite(w => !w);
		// turns are flipped
		playSound(isWhite ? turn === Side.black : turn === Side.white, flags);
		setBoardUpdate((u) => !u);
		setTurn(turn);
	}, [isWhite]);

	useEffectOnce(() => {
		const audio = new Audio("/sound/game-start.mp3");
		audio.play();
	}, []);

	useEffect(() => {
		const fn = onStart(boardRef, selectedRef, timeoutRef, isWhite, update);
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
	}, [boardRef, isWhite, update]);

	return (
		<>
			<span style={{ display: "block" }}>Turn: {turn ? "black" : "white"}</span>
			<div className="cr-cr">
				<div className="cr-wrap orientation-white manipulable" style={{ width: `${size}px`, height: `${size}px` }}>
					<cr-container style={{ width: `${size}px`, height: `${size}px` }}>
						<cr-board ref={ref}>
							{/* <cr-square></cr-square> */}
							{Array.from({ length: 64 }, (_, index) => {
								// so it is reactive
								boardUpdate;
								const square = isWhite ? index : 63 - index;
								// console.log(square);

								// for (let rank = 0n; rank < 8n; rank++) {
								// 	for (let file = 0n; file < 8n; file++) {
								// 		const square = isWhite ? rank * 8n + file : 63n - (rank * 8n + file);

								// 		if (file === 0n) {
								// 			buffer += `${isWhite ? 8n - rank : rank + 1n}  | `;
								// 		}

								// 		const piece: PieceTypeValues | null = this.getPieceInSquare(square);
								// 	}
								// 	buffer += '\n';
								// }
								// buffer += isWhite ? '\n     a b c d e f g h\n' : '\n     h g f e d c b a\n';

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
										/>
									);
								}
							})}
						</cr-board>
					</cr-container>
				</div>
			</div>
		</>
	);
}
