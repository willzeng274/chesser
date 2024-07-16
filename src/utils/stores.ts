import { create } from 'zustand';

export enum GameType {
    undefined = 0,
    sandbox = 1,
    stockfish = 2,
    multiplayer = 3,
}

interface GameState {
    gameType: GameType;
    isWhite: boolean;
    setGame: (type: GameType) => void;
    setIsWhite: (is: boolean) => void;
    ws: WebSocket | null,
    setWs: (ws: WebSocket | null) => void;
    // increase: (by: number) => void;
}

export const useGameStore = create<GameState>()((set) => ({
    gameType: GameType.undefined,
    isWhite: true,
    setGame: (type) => set(() => ({ gameType: type })),
    setIsWhite: (is) => set(() => ({ isWhite: is })),
    ws: null,
    setWs: (ws) => set(() => ({ ws })),
    // increase: (by) => set((state) => ({ bears: state.bears + by })),
}));
