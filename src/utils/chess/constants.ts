export const Squares = {
    a8: 0,
    b8: 1,
    c8: 2,
    d8: 3,
    e8: 4,
    f8: 5,
    g8: 6,
    h8: 7,
    a7: 8,
    b7: 9,
    c7: 10,
    d7: 11,
    e7: 12,
    f7: 13,
    g7: 14,
    h7: 15,
    a6: 16,
    b6: 17,
    c6: 18,
    d6: 19,
    e6: 20,
    f6: 21,
    g6: 22,
    h6: 23,
    a5: 24,
    b5: 25,
    c5: 26,
    d5: 27,
    e5: 28,
    f5: 29,
    g5: 30,
    h5: 31,
    a4: 32,
    b4: 33,
    c4: 34,
    d4: 35,
    e4: 36,
    f4: 37,
    g4: 38,
    h4: 39,
    a3: 40,
    b3: 41,
    c3: 42,
    d3: 43,
    e3: 44,
    f3: 45,
    g3: 46,
    h3: 47,
    a2: 48,
    b2: 49,
    c2: 50,
    d2: 51,
    e2: 52,
    f2: 53,
    g2: 54,
    h2: 55,
    a1: 56,
    b1: 57,
    c1: 58,
    d1: 59,
    e1: 60,
    f1: 61,
    g1: 62,
    h1: 63,
} as const;

export enum Side {
    white,
    black,
}

export function oppositeSide(side: Side) {
    return side === Side.white ? Side.black : Side.white;
}

export abstract class CastlingRights {
    static readonly wKingSide = 1n;
    static readonly wQueenSide = 2n;
    static readonly bKingSide = 4n;
    static readonly bQueenSide = 8n;

    static readonly white = CastlingRights.wKingSide | CastlingRights.wQueenSide;
    static readonly black = CastlingRights.bKingSide | CastlingRights.bQueenSide;
}

export class PieceType {
    static readonly wPawn: PieceTypeValues = 0;
    static readonly wKnight: PieceTypeValues = 1;
    static readonly wBishop: PieceTypeValues = 2;
    static readonly wRook: PieceTypeValues = 3;
    static readonly wQueen: PieceTypeValues = 4;
    static readonly wKing: PieceTypeValues = 5;

    static readonly bPawn: PieceTypeValues = 6;
    static readonly bKnight: PieceTypeValues = 7;
    static readonly bBishop: PieceTypeValues = 8;
    static readonly bRook: PieceTypeValues = 9;
    static readonly bQueen: PieceTypeValues = 10;
    static readonly bKing: PieceTypeValues = 11;

    static readonly whitePieces = [PieceType.wPawn, PieceType.wKnight, PieceType.wBishop, PieceType.wRook, PieceType.wQueen, PieceType.wKing];
    static readonly blackPieces = [PieceType.bPawn, PieceType.bKnight, PieceType.bBishop, PieceType.bRook, PieceType.bQueen, PieceType.bKing];

    static side(idx: PieceTypeValues): Side {
        if (idx >= 0 && idx < 6) {
            return Side.white;
        } else {
            return Side.black;
        }
    }
}

export type PieceTypeValues =
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11;

export const asciiPieces = {
    [PieceType.wKing]: "K",
    [PieceType.wQueen]: "Q",
    [PieceType.wRook]: "R",
    [PieceType.wBishop]: "B",
    [PieceType.wKnight]: "N",
    [PieceType.wPawn]: "P",
    [PieceType.bKing]: "k",
    [PieceType.bQueen]: "q",
    [PieceType.bRook]: "r",
    [PieceType.bBishop]: "b",
    [PieceType.bKnight]: "n",
    [PieceType.bPawn]: "p",
} as const;

export const unicodePieces = {
    [PieceType.bPawn]: "♟︎",
    [PieceType.bKnight]: "♞",
    [PieceType.bBishop]: "♝",
    [PieceType.bRook]: "♜",
    [PieceType.bQueen]: "♛",
    [PieceType.bKing]: "♚",
    [PieceType.wPawn]: "♙",
    [PieceType.wKnight]: "♘",
    [PieceType.wBishop]: "♗",
    [PieceType.wRook]: "♖",
    [PieceType.wQueen]: "♕",
    [PieceType.wKing]: "♔"
} as const;

export const unicodePiecesFlipped = {
    [PieceType.bPawn]: "♙",
    [PieceType.bKnight]: "♘",
    [PieceType.bBishop]: "♗",
    [PieceType.bRook]: "♖",
    [PieceType.bQueen]: "♕",
    [PieceType.bKing]: "♔",
    [PieceType.wPawn]: "♟︎",
    [PieceType.wKnight]: "♞",
    [PieceType.wBishop]: "♝",
    [PieceType.wRook]: "♜",
    [PieceType.wQueen]: "♛",
    [PieceType.wKing]: "♚"
} as const;

export const classPieces = {
    [PieceType.bPawn]: "black pawn",
    [PieceType.bKnight]: "black knight",
    [PieceType.bBishop]: "black bishop",
    [PieceType.bRook]: "black rook",
    [PieceType.bQueen]: "black queen",
    [PieceType.bKing]: "black king",
    [PieceType.wPawn]: "white pawn",
    [PieceType.wKnight]: "white knight",
    [PieceType.wBishop]: "white bishop",
    [PieceType.wRook]: "white rook",
    [PieceType.wQueen]: "white queen",
    [PieceType.wKing]: "white king"
  } as const;

export type PiecesFenChar =
    | "K"
    | "Q"
    | "R"
    | "B"
    | "N"
    | "P"
    | "k"
    | "q"
    | "r"
    | "b"
    | "n"
    | "p"
    | "/"
    | "1"
    | "2"
    | "3"
    | "4"
    | "5"
    | "8";

// inverted asciiPieces
export const pieceFromString = {
    "K": PieceType.wKing,
    "Q": PieceType.wQueen,
    "R": PieceType.wRook,
    "B": PieceType.wBishop,
    "N": PieceType.wKnight,
    "P": PieceType.wPawn,
    "k": PieceType.bKing,
    "q": PieceType.bQueen,
    "r": PieceType.bRook,
    "b": PieceType.bBishop,
    "n": PieceType.bKnight,
    "p": PieceType.bPawn,
} as const;

export const bishopRelevantBits = [
    6n,
    5n,
    5n,
    5n,
    5n,
    5n,
    5n,
    6n,
    5n,
    5n,
    5n,
    5n,
    5n,
    5n,
    5n,
    5n,
    5n,
    5n,
    7n,
    7n,
    7n,
    7n,
    5n,
    5n,
    5n,
    5n,
    7n,
    9n,
    9n,
    7n,
    5n,
    5n,
    5n,
    5n,
    7n,
    9n,
    9n,
    7n,
    5n,
    5n,
    5n,
    5n,
    7n,
    7n,
    7n,
    7n,
    5n,
    5n,
    5n,
    5n,
    5n,
    5n,
    5n,
    5n,
    5n,
    5n,
    6n,
    5n,
    5n,
    5n,
    5n,
    5n,
    5n,
    6n
] as const;

export const rookRelevantBits = [
    12n,
    11n,
    11n,
    11n,
    11n,
    11n,
    11n,
    12n,
    11n,
    10n,
    10n,
    10n,
    10n,
    10n,
    10n,
    11n,
    11n,
    10n,
    10n,
    10n,
    10n,
    10n,
    10n,
    11n,
    11n,
    10n,
    10n,
    10n,
    10n,
    10n,
    10n,
    11n,
    11n,
    10n,
    10n,
    10n,
    10n,
    10n,
    10n,
    11n,
    11n,
    10n,
    10n,
    10n,
    10n,
    10n,
    10n,
    11n,
    11n,
    10n,
    10n,
    10n,
    10n,
    10n,
    10n,
    11n,
    12n,
    11n,
    11n,
    11n,
    11n,
    11n,
    11n,
    12n
] as const;


