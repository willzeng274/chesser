// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import { useState } from "react";
import "./App.css";
import BoardUI from "./components/board/Board.tsx";
import Selection from "./components/Selection.tsx";
import { Attacks, initAttacks } from "./utils/chess/attacks.ts";
import { GameType, useGameStore } from "./utils/stores.ts";
import useEffectOnce from "./utils/useEffectOnce.ts";
import Loading from "./components/Loading.tsx";

function App() {
	const game = useGameStore((state) => state.gameType);
	const [attacks, setAttacks] = useState<Attacks | null>(null);

	useEffectOnce(() => {
		const ds = Date.now();

		initAttacks().then((attacks) => {
			setAttacks(attacks);
			console.log("Init attacks took: ", Date.now() - ds);
		});
	}, []);

	useEffectOnce(() => {
		if (game !== GameType.undefined) {
			const audio = new Audio("/sound/game-start.mp3");
			audio.play();
		}
	}, [game]);

	// useEffectOnce(() => {
	// 	console.log("ATTACKS", attacks);
	// }, [attacks]);

	return (
		<>
			{attacks === null ? (
				<Loading />
			) : (
				<>
					{game === GameType.undefined && <Selection />}
					{game !== GameType.undefined && <BoardUI attacks={attacks} />}
				</>
			)}
		</>
	);
}

export default App;
