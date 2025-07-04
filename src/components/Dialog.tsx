import { useState } from "react";
import { createPortal } from "react-dom";
import { Side } from "../utils/chess";
import { GameType, useGameStore } from "../utils/stores";

interface DialogArgs {
	open: Open;
	setOpen: React.Dispatch<React.SetStateAction<Open>>;
}

interface Open {
	active: boolean;
	game: GameType;
}

export default function Dialog({ open, setOpen }: DialogArgs) {
	const [checked, setChecked] = useState<Side>(Side.white);
	const [searching, setSearching] = useState<boolean>(false);

	const setGame = useGameStore((state) => state.setGame);
	const setIsWhite = useGameStore((state) => state.setIsWhite);

	const setWs = useGameStore((state) => state.setWs);

	const onSubmit = () => {
		// console.log("submitted");
		if (open.game === GameType.stockfish) {
			setGame(open.game);
			setIsWhite(checked === Side.white);
			setOpen({
				active: false,
				game: open.game,
			});
		} else if (open.game === GameType.multiplayer) {
			        const ws = new WebSocket(import.meta.env.PROD ? "https://chesser-backend.wzeng.dev/ws" : "/api/ws");

			setWs(ws);

			ws.addEventListener("open", () => {
				ws.send(
					JSON.stringify({
						type: "queue",
						data: {
							color: checked,
						}
					})
				);
			});

			setSearching(true);

			const listener = (ev: MessageEvent) => {
				const data = JSON.parse(ev.data);
				if (data.type === "match") {
					setGame(open.game);
					setIsWhite(checked === Side.white);
					setOpen({
						active: false,
						game: open.game,
					});
				} else {
					console.log("unknown event", ev, data);
				}
				ws.removeEventListener("message", listener);
			};
			ws.addEventListener("message", listener);
		}
	};

	return (
		<>
			{searching && (
				<>
					<div className="fixed inset-0 z-50 bg-black/80" />
					<div className="flex flex-col justify-center items-center fixed left-[50%] top-[50%] text-white z-50 translate-x-[-50%] translate-y-[-50%]">
						<MagnifyingGlassIcon className="absolute animation-spin-circle left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]" />
						<p className="mt-40 dots">Searching for a player that wants to play as {checked === Side.white ? "black" : "white"}</p>
					</div>
				</>
			)}
			{!searching && createPortal(
				<>
					<div className="fixed inset-0 z-50 bg-black/80" />
					<div
						role="dialog"
						className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg sm:max-w-[425px]"
					>
						<div className="flex flex-col space-y-1.5 text-center sm:text-left">
							<h2 className="text-lg font-semibold leading-none tracking-tight">Choose your side</h2>
							<p className="text-sm text-muted-foreground">
								Pick which side to play against {open.game === GameType.stockfish ? "stockfish" : "other players"}
							</p>
						</div>

						<button
							data-state={checked === Side.white ? "checked" : undefined}
							onClick={() => setChecked(Side.white)}
							className="text-sm font-medium leading-none flex flex-col items-center justify-between rounded-md border-2 border-[#f4f4f5] bg-white p-4 hover:bg-[#f4f4f5] hover:text-black data-[state=checked]:border-black"
						>
							White
						</button>

						<button
							data-state={checked === Side.black ? "checked" : undefined}
							onClick={() => setChecked(Side.black)}
							className="text-sm font-medium leading-none flex flex-col items-center justify-between rounded-md border-2 border-[#f4f4f5] bg-white p-4 hover:bg-[#f4f4f5] hover:text-black data-[state=checked]:border-black"
						>
							Black
						</button>

						<button
							className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 bg-black text-white shadow hover:bg-black/90 h-9 px-4 py-2"
							onClick={onSubmit}
						>
							Submit
						</button>

						<button
							onClick={() =>
								setOpen({
									active: false,
									game: GameType.undefined,
								})
							}
							className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none"
						>
							<CloseIcon />
							<span className="sr-only" />
						</button>
					</div>
				</>,
				document.body
			)}
		</>
	);
}

function CloseIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg {...props} width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
			<path
				d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
				fill="currentColor"
				fillRule="evenodd"
				clipRule="evenodd"
			></path>
		</svg>
	);
}

function MagnifyingGlassIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg {...props} width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={"h-32 w-32 " + props.className}>
			<path
				d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z"
				fill="currentColor"
				fillRule="evenodd"
				clipRule="evenodd"
			></path>
		</svg>
	);
}
