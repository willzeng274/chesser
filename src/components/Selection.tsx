import { useState } from "react";
import { GameType, useGameStore } from "../utils/stores";
import Dialog from "./Dialog";

// interface SelectionProps {
//     hidden: boolean;
// }

interface Open {
    active: boolean;
    game: GameType;
}

export default function Selection() {
    const setGame = useGameStore((state) => state.setGame);

    const [open, setOpen] = useState<Open>({
        active: false,
        game: GameType.undefined
    });

	return (
        <>
            {open.active ? <Dialog open={open} setOpen={setOpen} /> : <></>}
            <div className="w-full min-h-screen flex z-10 justify-center">
                <div className="fixed inset-0 bg-gray-900/95 z-0" />
                <div className="z-10 max-w-6xl w-full px-4 py-12 md:px-8 md:py-16 lg:px-12 lg:py-20 flex flex-col items-center justify-center">
                    <div className="text-center space-y-4">
                        <h1 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">Play Chess</h1>
                        <p className="text-gray-500 md:text-lg lg:text-xl">
                            Select a chess mode to play.
                        </p>
                    </div>
                    <div className="flex flex-col lg:flex-row gap-10 lg:gap-20 mt-8 w-full">
                        <div
                            className="bg-white rounded-lg p-4 flex flex-col flex-1 items-center text-center space-y-4 cursor-pointer hover:scale-105 duration-200"
                            onClick={() => setGame(GameType.sandbox)}
                        >
                            <div className="bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center">
                                <PuzzleIcon className="w-8 h-8 text-black" />
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-lg font-semibold text-black">Sandbox (Freeplay)</h3>
                                <p className="text-sm text-gray-500">
                                    Play against yourself or a friend next to you in sandbox mode.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <ArrowRightIcon className="w-4 h-4 hidden sm:block" />
                                <span className="sr-only">Next</span>
                            </div>
                        </div>
                        <div
                            className="bg-white rounded-lg p-4 flex flex-col flex-1 items-center text-center space-y-4 cursor-pointer hover:scale-105 duration-200"
                            onClick={() => setOpen({ active: true, game: GameType.stockfish })}
                        >
                            <div className="bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center">
                                <ComputerIcon className="w-8 h-8 text-black" />
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-lg font-semibold text-black">Against Bot (Engine)</h3>
                                <p className="text-sm text-gray-500">Play against the powerful Stockfish chess engine.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <ArrowRightIcon className="w-4 h-4 hidden sm:block" />
                                <span className="sr-only">Next</span>
                            </div>
                        </div>
                        <div
                            className="bg-white rounded-lg p-4 flex flex-col flex-1 items-center text-center space-y-4 cursor-pointer hover:scale-105 duration-200"
                            onClick={() => setOpen({ active: true, game: GameType.multiplayer })}
                        >
                            <div className="bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center">
                                <CrosshairIcon className="w-8 h-8 text-black" />
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-lg font-semibold text-black">Play Online</h3>
                                <p className="text-sm text-gray-500">Play against other players online.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <ArrowRightIcon className="w-4 h-4 hidden sm:block" />
                                <span className="sr-only">Next</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
	);
}

function ArrowRightIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M5 12h14" />
			<path d="m12 5 7 7-7 7" />
		</svg>
	);
}

function ComputerIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<rect width="14" height="8" x="5" y="2" rx="2" />
			<rect width="20" height="8" x="2" y="14" rx="2" />
			<path d="M6 18h2" />
			<path d="M12 18h6" />
		</svg>
	);
}

function CrosshairIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="12" cy="12" r="10" />
			<line x1="22" x2="18" y1="12" y2="12" />
			<line x1="6" x2="2" y1="12" y2="12" />
			<line x1="12" x2="12" y1="6" y2="2" />
			<line x1="12" x2="12" y1="22" y2="18" />
		</svg>
	);
}

function PuzzleIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z" />
		</svg>
	);
}
