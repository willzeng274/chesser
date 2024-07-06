import { PieceTypeValues } from "./constants";

export class MoveFlags {
    static readonly quiet = 0;
    static readonly doublePush = 1;
    static readonly kingSideCastle = 2;
    static readonly queenSideCastle = 3;
    static readonly capture = 8;
    // static readonly captures = 15;
    static readonly enPassant = 10;
    // static readonly promotion = 7;
    static readonly promotionCapture = 12;
}


interface MoveInteface {
    from: bigint;
    to: bigint;
    piece: PieceTypeValues;
    promotedPiece?: PieceTypeValues;
    flags: number;
}

export class Move {
    from: bigint;
    to: bigint;
    piece: PieceTypeValues;
    promotedPiece?: PieceTypeValues;
    flags: number;

    constructor({
        from,
        to,
        piece,
        promotedPiece,
        flags
    }: MoveInteface) {
        this.from = from;
        this.to = to;
        this.piece = piece;
        this.promotedPiece = promotedPiece;
        this.flags = flags;
    }


    equals(other: Move) {
        return other.from === this.from &&
            other.to === this.to &&
            other.flags === this.flags &&
            other.piece === this.piece &&
            other.promotedPiece === this.promotedPiece;
    }

    // toString() {
    //   return `${asciiPieces[piece]} ${squareToAlgebraic(from)} ${squareToAlgebraic(to)} ${promotedPiece !== null ? asciiPieces[promotedPiece!] : ''}`;
    // }

    public get isQuiet(): boolean {
        return this.flags === 0;
    }
    public get isDoublePush(): boolean {
        return this.flags === MoveFlags.doublePush;
    }
    public get isKingSideCastle(): boolean {
        return this.flags === MoveFlags.kingSideCastle;
    }
    public get isQueenSideCastle(): boolean {
        return this.flags === MoveFlags.queenSideCastle;
    }
    public get isEnPassant(): boolean {
        return this.flags === MoveFlags.enPassant;
    }

    public get isPawnPromotion(): boolean {
        return !!this.promotedPiece;
    }

    public get isPawnPromotionCapture(): boolean {
        return this.flags === MoveFlags.promotionCapture;
    }

    public get isCapture(): boolean {
        return (this.flags & MoveFlags.capture) !== 0;
    }
}