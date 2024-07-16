import { MoveFlags } from "./chess/move";
import { SquareValue } from "./types";

export function playAudioFile(file: string) {
    const audio = new Audio(`/sound/${file}.mp3`);
    audio.play();
}

export function playSound(isSelf: boolean, flag: number) {
	switch (flag) {
		case MoveFlags.quiet:
		case MoveFlags.doublePush:
		case MoveFlags.enPassant: {
			// console.log(isSelf ? "/sound/move-self.mp3" : "/sound/move-opponent.mp3");
            playAudioFile(isSelf ? "move-self" : "move-opponent");
			// const audio = new Audio(isSelf ? "/sound/move-self.mp3" : "/sound/move-opponent.mp3");
			// audio.play();
			break;
		}
		case MoveFlags.capture: {
            playAudioFile("capture");
			// const audio = new Audio("/sound/capture.mp3");
			// audio.play();
			break;
		}
		case MoveFlags.kingSideCastle:
		case MoveFlags.queenSideCastle: {
            playAudioFile("castle");
			// const audio = new Audio("/sound/castle.mp3");
			// audio.play();
			break;
		}
		case MoveFlags.promotionCapture: {
            playAudioFile("promote");
			// const audio = new Audio("/sound/promote.mp3");
			// audio.play();
			break;
		}
	}
}

export function getTransformStyle(square: SquareValue, size: number): string {
	const x = square % 8;
	const y = Math.floor(square / 8);
	const percentX = size * (x / 8);
	const percentY = size * (y / 8);
	return `translate(${percentX}px, ${percentY}px)`;
}

export function checkSize(px: number, h: boolean) {
	return window.matchMedia(`(min-width: ${px}px)`).matches && (!h || window.matchMedia(`(min-height: ${px}px)`).matches);
}

// function getSquareFromFileAndRank(x: number, y: number) {
//     return y*8 + x;
// }