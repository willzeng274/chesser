import { getBishopAttacks, getQueenAttacks, getRookAttacks, kingAttacks, knightAttacks, pawnAttacks } from "./attacks";
import { BitBoard } from "./bitboard";
import {
    Side, PieceType, CastlingRights,
    // oppositeSide,
    unicodePieces, asciiPieces, PieceTypeValues,
    oppositeSide
} from "./constants";
import { getLs1bIndex } from "./utils";
// import { getLs1bIndex } from "./utils";

// interface BitBoards {
//     [k: number]: BitBoard
// }

interface PrintBoardArgs {
    side?: Side,
    useUnicodeCharacters: boolean,
    fillEmptySquares: boolean,
}

interface BoardArgs {
    turn: Side,
    enPassant?: bigint,
    castlingRights: bigint,
    halfMoveClock: bigint,
    // this.turn,
    // this.enPassant,
    // this.castlingRights,
    // this.halfMoveClock,
    whiteKing: BitBoard,
    whiteQueens: BitBoard,
    whiteRooks: BitBoard,
    whiteBishops: BitBoard,
    whiteKnights: BitBoard,
    whitePawns: BitBoard,
    blackKing: BitBoard,
    blackQueens: BitBoard,
    blackRooks: BitBoard,
    blackBishops: BitBoard,
    blackKnights: BitBoard,
    blackPawns: BitBoard
}

export class Board {
    turn: Side;
    castlingRights: bigint;
    enPassant?: bigint;
    halfMoveClock: bigint;
    movesPlayed: bigint = 1n;

    pieceBitBoards: Map<PieceTypeValues, BitBoard> = new Map();

    constructor({
        turn,
        enPassant,
        castlingRights,
        halfMoveClock,
        whiteKing,
        whiteQueens,
        whiteRooks,
        whiteBishops,
        whiteKnights,
        whitePawns,
        blackKing,
        blackQueens,
        blackRooks,
        blackBishops,
        blackKnights,
        blackPawns,
    }: BoardArgs) {
        this.turn = turn;
        this.enPassant = enPassant;
        this.castlingRights = castlingRights;
        this.halfMoveClock = halfMoveClock;

        this.pieceBitBoards.set(PieceType.wKing, whiteKing);
        this.pieceBitBoards.set(PieceType.wQueen, whiteQueens);
        this.pieceBitBoards.set(PieceType.wRook, whiteRooks);
        this.pieceBitBoards.set(PieceType.wBishop, whiteBishops);
        this.pieceBitBoards.set(PieceType.wKnight, whiteKnights);
        this.pieceBitBoards.set(PieceType.wPawn, whitePawns);

        this.pieceBitBoards.set(PieceType.bKing, blackKing);
        this.pieceBitBoards.set(PieceType.bQueen, blackQueens);
        this.pieceBitBoards.set(PieceType.bRook, blackRooks);
        this.pieceBitBoards.set(PieceType.bBishop, blackBishops);
        this.pieceBitBoards.set(PieceType.bKnight, blackKnights);
        this.pieceBitBoards.set(PieceType.bPawn, blackPawns);
    }

    static startingPosition(): Board {
        return new Board({
            castlingRights: CastlingRights.wKingSide |
                CastlingRights.wQueenSide |
                CastlingRights.bKingSide |
                CastlingRights.bQueenSide,
            halfMoveClock: 0n,
            turn: Side.white,
            enPassant: undefined,
            whiteKing: new BitBoard(1152921504606846976n),
            whiteQueens: new BitBoard(576460752303423488n),
            whiteRooks: new BitBoard(-9151314442816847872n),
            whiteBishops: new BitBoard(2594073385365405696n),
            whiteKnights: new BitBoard(4755801206503243776n),
            whitePawns: new BitBoard(71776119061217280n),
            blackKing: new BitBoard(16n),
            blackQueens: new BitBoard(8n),
            blackRooks: new BitBoard(129n),
            blackBishops: new BitBoard(36n),
            blackKnights: new BitBoard(66n),
            blackPawns: new BitBoard(65280n)
        });
    }

    static empty(): Board {
        return new Board({
            castlingRights: 0n,
            halfMoveClock: 0n,
            turn: Side.white,
            enPassant: undefined,
            whiteKing: new BitBoard(0n),
            whiteQueens: new BitBoard(0n),
            whiteRooks: new BitBoard(0n),
            whiteBishops: new BitBoard(0n),
            whiteKnights: new BitBoard(0n),
            whitePawns: new BitBoard(0n),
            blackKing: new BitBoard(0n),
            blackQueens: new BitBoard(0n),
            blackRooks: new BitBoard(0n),
            blackBishops: new BitBoard(0n),
            blackKnights: new BitBoard(0n),
            blackPawns: new BitBoard(0n)
        });
    }

    get whitePieces(): BitBoard {
        const pieceBitBoards = this.pieceBitBoards;

        // i miss the `|` operator :pensive:
        return pieceBitBoards.get(PieceType.wKing)!.union(
            pieceBitBoards.get(PieceType.wQueen)!.union(
                pieceBitBoards.get(PieceType.wRook)!.union(
                    pieceBitBoards.get(PieceType.wBishop)!.union(
                        pieceBitBoards.get(PieceType.wKnight)!.union(
                            pieceBitBoards.get(PieceType.wPawn)!))
                )
            )
        );
    }

    get blackPieces(): BitBoard {
        const pieceBitBoards = this.pieceBitBoards;

        // i miss the `|` operator :pensive:
        return pieceBitBoards.get(PieceType.bKing)!.union(
            pieceBitBoards.get(PieceType.bQueen)!.union(
                pieceBitBoards.get(PieceType.bRook)!.union(
                    pieceBitBoards.get(PieceType.bBishop)!.union(
                        pieceBitBoards.get(PieceType.bKnight)!.union(
                            pieceBitBoards.get(PieceType.bPawn)!))
                )
            )
        );
    }

    get allPieces(): BitBoard { return this.whitePieces.union(this.blackPieces) }


    get isCheck() {
        return this.isSquareAttacked(
            getLs1bIndex(this.turn === Side.white
                ? this.pieceBitBoards.get(PieceType.wKing)!.value
                : this.pieceBitBoards.get(PieceType.bKing)!.value),
            oppositeSide(this.turn));
    }

    piecesOf(side: Side) {
        return side === Side.white ? this.whitePieces : this.blackPieces;
    }

    printBoard({
        side,
        useUnicodeCharacters = true,
        fillEmptySquares = false
    }: PrintBoardArgs) {
        // const isWhite = (side === Side.white) || this.turn === Side.white;
        const isWhite = side === Side.white;

        let buffer = "\n";

        if (!useUnicodeCharacters) {
            buffer += `      Turn: ${this.turn === Side.white ? 'white' : 'black'}\n`;
        }

        for (let rank = 0n; rank < 8n; rank++) {
            for (let file = 0n; file < 8n; file++) {
                const square = isWhite ? rank * 8n + file : 63n - (rank * 8n + file);

                if (file === 0n) {
                    buffer += `${isWhite ? 8n - rank : rank + 1n}  | `;
                }

                const piece: PieceTypeValues | null = this.getPieceInSquare(square);

                if (piece !== null) {
                    buffer +=
                        `${useUnicodeCharacters ? unicodePieces[piece] : asciiPieces[piece]} `;
                } else {
                    buffer += fillEmptySquares ? '. ' : '  ';
                }
            }
            buffer += '\n';
        }

        buffer += '   ------------------';
        buffer += isWhite ? '\n     a b c d e f g h\n' : '\n     h g f e d c b a\n';

        return buffer;
    }

    getPieceInSquare(square: bigint): PieceTypeValues | null {
        /* Returns the piece occupying the given square
          if the square is empty returns null */

        // Object.entries returns the keys as stringgs
        // same for Object.keys()
        for (const [key, value] of this.pieceBitBoards.entries()) {
            // get all of the keys (piece type) and value (bitboard) of pieceBitBoards
            const pieceType: PieceTypeValues = key;
            const bitboard = value;

            // bitboard is the value
            if (bitboard.getBit(square) === 1n) { // if the 'square' of the bitboard is set 
                return pieceType; // return the key
            }
        }
        return null;
    }

    toFen() {
        /* Converts the current position into FEN */

        let fen = '';
        let count = 0;

        for (let rank = 0n; rank < 8n; rank++) {
            for (let file = 0n; file < 8n; file++) {
                const square = rank * 8n + file;

                const piece = this.getPieceInSquare(square);

                if (piece === null) {
                    count++;
                    continue;
                } else {
                    fen += `${count > 0 ? count : ''}${asciiPieces[piece]!}`;
                    count = 0;
                }
            }

            if (rank < 7) {
                fen += `${count > 0 ? count : ''}/`;
                count = 0;
            }
        }

        fen += this.turn === Side.white ? " w" : " b";

        // fen += ` ${castlingRightsToStr(this.castlingRights)} `;
        fen += ` - `;

        // if (this.enPassant !==  null) {
        //     fen += squareToAlgebraic(enPassant!);
        // } else {
        //     fen += "- ";
        // }
        fen += "- "; // todo: impl enPassant

        fen += `${this.halfMoveClock} `;
        fen += `${this.movesPlayed}`;

        return fen;
    }

    isSquareAttacked(square: bigint, side: Side): boolean {
        const pieceBitBoards = this.pieceBitBoards;
        const squareNum = Number(square);
        // attacked by white pawns
        if ((side === Side.white) &&
            (pawnAttacks[1][squareNum] & pieceBitBoards.get(PieceType.wPawn)!.value) !== 0n) {
            return true;
        }

        // attacked by black pawns
        if ((side == Side.black) &&
            (pawnAttacks[0][squareNum] & pieceBitBoards.get(PieceType.bPawn)!.value) !== 0n) {
            return true;
        }

        // attacked by knights
        if ((knightAttacks[squareNum] &
            ((side === Side.white)
                ? pieceBitBoards.get(PieceType.wKnight)!.value
                : pieceBitBoards.get(PieceType.bKnight)!.value)) !== 0n) return true;

        // attacked by bishops
        if ((getBishopAttacks(square, this.allPieces).intersect(
            ((side === Side.white)
                ? pieceBitBoards.get(PieceType.wBishop)!
                : pieceBitBoards.get(PieceType.bBishop)!)))
            .notEmpty) return true;

        // attacked by rooks
        if ((getRookAttacks(square, this.allPieces).intersect(
            ((side === Side.white)
                ? pieceBitBoards.get(PieceType.wRook)!
                : pieceBitBoards.get(PieceType.bRook)!)))
            .notEmpty) return true;

        // attacked by bishops
        if ((getQueenAttacks(square, this.allPieces).intersect(
            ((side === Side.white)
                ? pieceBitBoards.get(PieceType.wQueen)!
                : pieceBitBoards.get(PieceType.bQueen)!)))
            .notEmpty) return true;

        // attacked by kings
        if ((kingAttacks[squareNum] &
            ((side === Side.white)
                ? pieceBitBoards.get(PieceType.wKing)!.value
                : pieceBitBoards.get(PieceType.bKing)!.value))
            !== 0n) return true;

        // by default return false
        return false;
    }

    // No Need for now
    /* static Board fromFen(String fen) {
        var board = Board.empty();
      int square = 0;

      // ignore: no_leading_underscores_for_local_identifiers
      final _fen = fen.split(" ");
      final pieceFen = _fen[0];
      final moveTurn = _fen[1];
      final castlingRights = _fen[2];
      final enPassant = _fen[3];
      final halfMoveClock = int.tryParse(_fen.elementAtOrNull(4) ?? '0');
      final fullMoveNumber = int.tryParse(_fen.elementAtOrNull(5) ?? '0');

        for (String char in pieceFen.split('')) {
            if (int.tryParse(char) !==  null) {
                square += int.parse(char);
                continue;
            } else if (char === "/") {
                continue;
            } else {
          final piece = pieceFromString[char]!;

                board.pieceBitBoards[piece] =
                    board.pieceBitBoards[piece]!.setBit(square);
                square++;
            }
        }

        if (moveTurn === "w") {
            board.turn = Side.white;
        } else {
            board.turn = Side.black;
        }

        board.castlingRights = castlingRightsFromStr(castlingRights);

        if (enPassant !==  "-") {
            board.enPassant = squareFromAlgebraic(enPassant)!;
        }

        board.halfMoveClock = halfMoveClock ?? 0;

        board.movesPlayed = fullMoveNumber ?? 1;

        return board;
    } */
}

// console.log(Board.startingPosition().toFen());