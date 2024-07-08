import { assert } from "..";
import { getBishopAttacks, getQueenAttacks, getRookAttacks, kingAttacks, knightAttacks, pawnAttacks } from "./attacks";
import { BitBoard, BoardCopy } from "./bitboard";
import {
    Side, PieceType, CastlingRights,
    // oppositeSide,
    unicodePieces, asciiPieces, PieceTypeValues,
    oppositeSide,
    Squares,
    pieceFromString,
    PiecesFenChar
} from "./constants";
import { Move, MoveFlags } from "./move";
import { castlingRightsFromStr, getLs1bIndex, squareFromAlgebraic } from "./utils";
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
    
    legalMoves: Move[];

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

        this.legalMoves = this.generateLegalMoves();
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
        if ((side === Side.black) &&
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
    static fromFen(fen: string) {
        const board = Board.empty();
        let square = 0;

        // ignore: no_leading_underscores_for_local_identifiers
        const _fen = fen.split(" ");
        const pieceFen = _fen[0];
        const moveTurn = _fen[1];
        const castlingRights = _fen[2];
        const enPassant = _fen[3];
        const halfMoveClock = parseInt(_fen[4] ?? '0');
        const fullMoveNumber = parseInt(_fen[5] ?? '0');

        for (const char of pieceFen.split('') as PiecesFenChar[]) {
            if (!isNaN(parseInt(char))) {
                square += parseInt(char);
                continue;
            } else if (char === "/") {
                continue;
            } else {
                const piece = pieceFromString[char as Exclude<PiecesFenChar, "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "/">]!;

                board.pieceBitBoards.set(piece, board.pieceBitBoards.get(piece)!.setBit(BigInt(square)))
                square++;
            }
        }

        if (moveTurn === "w") {
            board.turn = Side.white;
        } else {
            board.turn = Side.black;
        }

        board.castlingRights = castlingRightsFromStr(castlingRights);

        if (enPassant !== "-") {
            board.enPassant = squareFromAlgebraic(enPassant)!;
        }

        board.halfMoveClock = BigInt(halfMoveClock ?? 0);

        board.movesPlayed = BigInt(fullMoveNumber ?? 1);

        board.legalMoves = board.generateLegalMoves();

        return board;
    }

    generatePseudoLegalMoves(side?: Side) {
        /* 
        If `side` is specified, generate moves for that side.
        Else generate moves for the side with the current turn 
      */
        const moves: Move[] = [];
        const side0 = side ?? this.turn;

        for (const piece of ((side0 === Side.white) ? PieceType.whitePieces : PieceType.blackPieces)) {
            let sourceSquare: bigint;
            let targetSquare: bigint;

            let bitboard = new BitBoard(this.pieceBitBoards.get(piece)!.value); // Create a new bitboard from the value
            if (PieceType.side(piece) === Side.white) {
                // gen white pawn moves and white castling moves here
                if (piece === PieceType.wPawn) {
                    // loop over white pawns within white pawn bitboard
                    while (bitboard.notEmpty) {
                        // init source square
                        sourceSquare = getLs1bIndex(bitboard.value);

                        // init target square
                        targetSquare = sourceSquare - 8n;

                        // generate quite pawn moves
                        // if (!(targetSquare < Squares.a8) && !get_bit(occupancies[both], targetSquare))
                        if (!(targetSquare < Squares.a8) && this.allPieces.getBit(targetSquare) !== 1n) {
                            // pawn promotion
                            if (sourceSquare >= Squares.a7 && sourceSquare <= Squares.h7) {
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: sourceSquare,
                                        to: targetSquare,
                                        promotedPiece: PieceType.wQueen,
                                        flags: 0
                                    }));
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: sourceSquare,
                                        to: targetSquare,
                                        promotedPiece: PieceType.wRook,
                                        flags: 0
                                    }));
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: sourceSquare,
                                        to: targetSquare,
                                        promotedPiece: PieceType.wBishop,
                                        flags: 0
                                    }));
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: sourceSquare,
                                        to: targetSquare,
                                        promotedPiece: PieceType.wKnight,
                                        flags: 0
                                    }));
                            } else {
                                // one square ahead pawn move
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: sourceSquare,
                                        to: targetSquare,
                                        flags: 0
                                    }));

                                // two squares ahead pawn move
                                if ((sourceSquare >= Squares.a2 &&
                                    sourceSquare <= Squares.h2) &&
                                    this.allPieces.getBit(targetSquare - 8n) !== 1n) {
                                    moves.push(new Move(
                                        {
                                            piece: piece,
                                            from: sourceSquare,
                                            to: targetSquare - 8n,
                                            flags: MoveFlags.doublePush
                                        }));
                                }
                            }
                        }

                        // init pawn attacks bitboard
                        let attacks = new BitBoard((pawnAttacks[PieceType.side(piece) === Side.white ? 0 : 1][Number(sourceSquare)] & this.blackPieces.value));

                        // generate pawn captures
                        while (attacks.notEmpty) {
                            // init target square
                            targetSquare = getLs1bIndex(attacks.value);

                            // pawn promotion
                            if (sourceSquare >= Squares.a7 && sourceSquare <= Squares.h7) {
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: sourceSquare,
                                        to: targetSquare,
                                        promotedPiece: PieceType.wQueen,
                                        flags: MoveFlags.promotionCapture
                                    }));
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: sourceSquare,
                                        to: targetSquare,
                                        promotedPiece: PieceType.wRook,
                                        flags: MoveFlags.promotionCapture
                                    }));
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: sourceSquare,
                                        to: targetSquare,
                                        promotedPiece: PieceType.wBishop,
                                        flags: MoveFlags.promotionCapture
                                    }));
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: sourceSquare,
                                        to: targetSquare,
                                        promotedPiece: PieceType.wKnight,
                                        flags: MoveFlags.promotionCapture
                                    }));
                            } else {
                                // one square ahead pawn move
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: sourceSquare,
                                        to: targetSquare,
                                        flags: MoveFlags.capture
                                    }));
                            }

                            // pop ls1b of the pawn attacks
                            attacks = attacks.popBit(targetSquare);
                        }

                        // generate enpassant captures
                        if (this.enPassant) {
                            // lookup pawn attacks and bitwise AND with enpassant square (bit)
                            const enpassantAttacks =
                                pawnAttacks[PieceType.side(piece) === Side.white ? 0 : 1][Number(sourceSquare)] &
                                (1n << this.enPassant!);

                            // make sure enpassant capture available
                            if (enpassantAttacks !== 0n) {
                                // init enpassant capture target square
                                const targetEnpassant = getLs1bIndex(enpassantAttacks);
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: sourceSquare,
                                        to: targetEnpassant,
                                        flags: MoveFlags.enPassant
                                    }));
                                // print(
                                // "${squareToAlgebraic(sourceSquare)} ${squareToAlgebraic(targetEnpassant)} pawn enpassant capture");
                            }
                        }

                        // pop ls1b from piece bitboard copy
                        bitboard = bitboard.popBit(sourceSquare);
                    }
                } else if (piece === PieceType.wKing) {
                    /*
                    This generates the moves based on the Board.castlingRights attribute
                    it does not validate if the position of the king or if the king moved
                  */
                    // king side castling is available
                    if ((this.castlingRights & CastlingRights.wKingSide) !== 0n) {
                        // make sure square between king and king's rook are empty
                        // if (!get_bit(occupancies[both], f1) && !get_bit(occupancies[both], g1))
                        if (this.allPieces.getBit(BigInt(Squares.f1)) !== 1n &&
                            this.allPieces.getBit(BigInt(Squares.g1)) !== 1n) {
                            // make sure king and the f1 squares are not under attacks
                            if (!this.isSquareAttacked(BigInt(Squares.e1), Side.black) &&
                                !this.isSquareAttacked(BigInt(Squares.f1), Side.black)) {
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: BigInt(Squares.e1),
                                        to: BigInt(Squares.g1),
                                        flags: MoveFlags.kingSideCastle
                                    }));
                                // print("e1g1  castling move\n");
                            }
                        }
                    }

                    // queen side castling is available
                    if ((this.castlingRights & CastlingRights.wQueenSide) !== 0n) {
                        // make sure square between king and queen's rook are empty
                        // if (!get_bit(occupancies[both], d1) && !get_bit(occupancies[both], c1) && !get_bit(occupancies[both], b1))
                        if (this.allPieces.getBit(BigInt(Squares.d1)) !== 1n &&
                            this.allPieces.getBit(BigInt(Squares.c1)) !== 1n &&
                            this.allPieces.getBit(BigInt(Squares.b1)) !== 1n) {
                            // make sure king and the d1 squares are not under attacks
                            if (!this.isSquareAttacked(BigInt(Squares.e1), Side.black) &&
                                !this.isSquareAttacked(BigInt(Squares.d1), Side.black)) {
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: BigInt(Squares.e1),
                                        to: BigInt(Squares.c1),
                                        flags: MoveFlags.queenSideCastle
                                    }));
                                // print("e1c1  castling move\n");
                            }
                        }
                    }
                }

                // loop over source squares of piece bitboard copy
            } else {
                // pick up black pawn bitboards index
                if (piece === PieceType.bPawn) {
                    // loop over white pawns within white pawn bitboard
                    while (bitboard.notEmpty) {
                        // init source square
                        sourceSquare = getLs1bIndex(bitboard.value);

                        // init target square
                        targetSquare = sourceSquare + 8n;

                        // generate quite pawn moves
                        // if (!(targetSquare > Squares.h1) && !get_bit(occupancies[both], targetSquare))
                        if (!(targetSquare > Squares.h1) && !this.allPieces.has(targetSquare)) {
                            // pawn promotion
                            if (sourceSquare >= Squares.a2 && sourceSquare <= Squares.h2) {
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: sourceSquare,
                                        to: targetSquare,
                                        promotedPiece: PieceType.bQueen,
                                        flags: 0
                                    }));
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: sourceSquare,
                                        to: targetSquare,
                                        promotedPiece: PieceType.bRook,
                                        flags: 0
                                    }));
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: sourceSquare,
                                        to: targetSquare,
                                        promotedPiece: PieceType.bBishop,
                                        flags: 0
                                    }));
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: sourceSquare,
                                        to: targetSquare,
                                        promotedPiece: PieceType.bKnight,
                                        flags: 0
                                    }));
                                // print(
                                // "${squareToAlgebraic(sourceSquare)} ${squareToAlgebraic(targetSquare)} q pawn promotion\n");
                                // print(
                                // "${squareToAlgebraic(sourceSquare)} ${squareToAlgebraic(targetSquare)} r pawn promotion\n");
                                // print(
                                // "${squareToAlgebraic(sourceSquare)} ${squareToAlgebraic(targetSquare)} b pawn promotion\n");
                                // print(
                                // "${squareToAlgebraic(sourceSquare)} ${squareToAlgebraic(targetSquare)} n pawn promotion\n");
                            } else {
                                // one square ahead pawn move
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: sourceSquare,
                                        to: targetSquare,
                                        flags: 0
                                    }));
                                // print(
                                // "${squareToAlgebraic(sourceSquare)} ${squareToAlgebraic(targetSquare)} pawn push\n");

                                // two squares ahead pawn move
                                if ((sourceSquare >= Squares.a7 &&
                                    sourceSquare <= Squares.h7) &&
                                    !this.allPieces.has(targetSquare + 8n)) {
                                    moves.push(new Move(
                                        {
                                            piece: piece,
                                            from: sourceSquare,
                                            to: targetSquare + 8n,
                                            flags: MoveFlags.doublePush
                                        }));
                                    // print(
                                    // "${squareToAlgebraic(sourceSquare)} ${squareToAlgebraic(targetSquare + 8)} double pawn push\n");
                                }
                            }
                        }

                        // init pawn attacks bitboard
                        let attacks = new BitBoard(pawnAttacks[PieceType.side(piece) === Side.white ? 0 : 1][Number(sourceSquare)] &
                            this.whitePieces.value);

                        // generate pawn captures
                        while (attacks.notEmpty) {
                            // init target square
                            targetSquare = getLs1bIndex(attacks.value);

                            // pawn promotion
                            if (sourceSquare >= Squares.a2 && sourceSquare <= Squares.h2) {
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: sourceSquare,
                                        to: targetSquare,
                                        promotedPiece: PieceType.bQueen,
                                        flags: MoveFlags.promotionCapture
                                    }));
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: sourceSquare,
                                        to: targetSquare,
                                        promotedPiece: PieceType.bRook,
                                        flags: MoveFlags.promotionCapture
                                    }));
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: sourceSquare,
                                        to: targetSquare,
                                        promotedPiece: PieceType.bBishop,
                                        flags: MoveFlags.promotionCapture
                                    }));
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: sourceSquare,
                                        to: targetSquare,
                                        promotedPiece: PieceType.bKnight,
                                        flags: MoveFlags.promotionCapture
                                    }));
                            } else {
                                // one square ahead pawn move
                                moves.push(new Move(
                                    {
                                        from: sourceSquare,
                                        to: targetSquare,
                                        piece: piece,
                                        flags: MoveFlags.capture
                                    }));
                            }

                            // pop ls1b of the pawn attacks
                            attacks = attacks.popBit(targetSquare);
                        }

                        // generate enpassant captures
                        if (this.enPassant) {
                            // lookup pawn attacks and bitwise AND with enpassant square (bit)
                            const enpassantAttacks =
                                pawnAttacks[PieceType.side(piece) === Side.white ? 0 : 1][Number(sourceSquare)] &
                                (1n << this.enPassant!);

                            // make sure enpassant capture available
                            if (enpassantAttacks !== 0n) {
                                // init enpassant capture target square
                                const targetEnpassant = getLs1bIndex(enpassantAttacks);
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: sourceSquare,
                                        to: targetEnpassant,
                                        flags: MoveFlags.enPassant
                                    }));
                                // print(
                                // "${squareToAlgebraic(sourceSquare)} ${squareToAlgebraic(targetEnpassant)} pawn enpassant capture\n");
                            }
                        }

                        // pop ls1b from piece bitboard copy
                        bitboard = bitboard.popBit(sourceSquare);
                    }
                }

                // castling moves
                if (piece === PieceType.bKing) {
                    // king side castling is available
                    if ((this.castlingRights & CastlingRights.bKingSide) !== 0n) {
                        // make sure square between king and king's rook are empty
                        // if (!get_bit(occupancies[both], f8) && !get_bit(occupancies[both], g8))
                        if (!this.allPieces.has(BigInt(Squares.f8)) && !this.allPieces.has(BigInt(Squares.g8))) {
                            // make sure king and the f8 squares are not under attacks
                            if (!this.isSquareAttacked(BigInt(Squares.e8), Side.white) &&
                                !this.isSquareAttacked(BigInt(Squares.f8), Side.white)) {
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: BigInt(Squares.e8),
                                        to: BigInt(Squares.g8),
                                        flags: MoveFlags.kingSideCastle
                                    }));
                                // print("e8g8  castling move\n");
                            }
                        }
                    }

                    // queen side castling is available
                    if ((this.castlingRights & CastlingRights.bQueenSide) !== 0n) {
                        // make sure square between king and queen's rook are empty
                        // if (!get_bit(occupancies[both], d8) && !get_bit(occupancies[both], c8) && !get_bit(occupancies[both], b8))
                        if (!this.allPieces.has(BigInt(Squares.d8)) &&
                            !this.allPieces.has(BigInt(Squares.c8)) &&
                            !this.allPieces.has(BigInt(Squares.b8))) {
                            // make sure king and the d8 squares are not under attacks
                            if (!this.isSquareAttacked(BigInt(Squares.e8), Side.white) &&
                                !this.isSquareAttacked(BigInt(Squares.d8), Side.white)) {
                                moves.push(new Move(
                                    {
                                        piece: piece,
                                        from: BigInt(Squares.e8),
                                        to: BigInt(Squares.c8),
                                        flags: MoveFlags.queenSideCastle
                                    }));
                                // print("e8c8  castling move: \n");
                            }
                        }
                    }
                }
            }

            // gen moves of rest of the pieces
            if (piece === PieceType.wKnight || piece === PieceType.bKnight) {
                // loop over source squares of piece bitboard copy
                while (bitboard.notEmpty) {
                    // init source square
                    sourceSquare = getLs1bIndex(bitboard.value);

                    // init piece attacks in order to get set of target squares
                    let attacks = new BitBoard(knightAttacks[Number(sourceSquare)] & ~this.piecesOf(PieceType.side(piece)).value);

                    // loop over target squares available from generated attacks
                    while (attacks.notEmpty) {
                        // init target square
                        targetSquare = getLs1bIndex(attacks.value);

                        // quite move
                        // if (!get_bit(((side === white) ? occupancies[black] : occupancies[white]), targetSquare))
                        if (!this.piecesOf(oppositeSide(PieceType.side(piece))).has(targetSquare)) {
                            moves.push(new Move(
                                {
                                    piece: piece,
                                    from: sourceSquare,
                                    to: targetSquare,
                                    flags: 0
                                }));
                            // print(
                            // "(N) ${squareToAlgebraic(sourceSquare)} ${squareToAlgebraic(targetSquare)} Piece quiet move\n");
                        } else {
                            // capture move
                            moves.push(new Move(
                                {
                                    piece: piece,
                                    from: sourceSquare,
                                    to: targetSquare,
                                    flags: MoveFlags.capture
                                }));
                            // print(
                            // "(N) ${squareToAlgebraic(sourceSquare)} ${squareToAlgebraic(targetSquare)}  piece capture\n");
                        }

                        // pop ls1b in current attacks set
                        attacks = attacks.popBit(targetSquare);
                    }

                    // pop ls1b of the current piece bitboard copy
                    bitboard = bitboard.popBit(sourceSquare);
                }
            } else if (piece === PieceType.bBishop || piece === PieceType.wBishop) {
                // loop over source squares of piece bitboard copy
                while (bitboard.notEmpty) {
                    // init source square
                    sourceSquare = getLs1bIndex(bitboard.value);

                    // init piece attacks in order to get set of target squares
                    let attacks =
                        getBishopAttacks(sourceSquare, this.allPieces).intersect(this.piecesOf(PieceType.side(piece)).complement());

                    // loop over target squares available from generated attacks
                    while (attacks.notEmpty) {
                        // init target square
                        targetSquare = getLs1bIndex(attacks.value);

                        // quite move
                        // if (!get_bit(((side === white) ? occupancies[black] : occupancies[white]), targetSquare))
                        if (!this.piecesOf(oppositeSide(PieceType.side(piece))).has(targetSquare)) {
                            moves.push(new Move(
                                {
                                    piece: piece,
                                    from: sourceSquare,
                                    to: targetSquare,
                                    flags: 0
                                }));
                            // print(
                            // "(B) ${squareToAlgebraic(sourceSquare)} ${squareToAlgebraic(targetSquare)}  piece quiet move\n",
                            // );
                        } else {
                            // capture move
                            moves.push(new Move(
                                {
                                    piece: piece,
                                    from: sourceSquare,
                                    to: targetSquare,
                                    flags: MoveFlags.capture
                                }));
                            // print(
                            // "(B) ${squareToAlgebraic(sourceSquare)} ${squareToAlgebraic(targetSquare)}  piece capture\n",
                            // );
                        }

                        // pop ls1b in current attacks set
                        attacks = attacks.popBit(targetSquare);
                    }

                    // pop ls1b of the current piece bitboard copy
                    bitboard = bitboard.popBit(sourceSquare);
                }
            } else if (piece === PieceType.wRook || piece === PieceType.bRook) {
                // loop over source squares of piece bitboard copy
                while (bitboard.notEmpty) {
                    // init source square
                    sourceSquare = getLs1bIndex(bitboard.value);

                    // init piece attacks in order to get set of target squares
                    let attacks = getRookAttacks(sourceSquare, this.allPieces).intersect(this.piecesOf(PieceType.side(piece)).complement());
                    // exclude friendly pieces

                    // loop over target squares available from generated attacks
                    while (attacks.notEmpty) {
                        // init target square
                        targetSquare = getLs1bIndex(attacks.value);

                        // quite move
                        // if (!get_bit(((side === white) ? occupancies[black] : occupancies[white]), targetSquare))
                        if (!this.piecesOf(oppositeSide(PieceType.side(piece))).has(targetSquare)) {
                            // not a capture
                            moves.push(new Move(
                                {
                                    piece: piece,
                                    from: sourceSquare,
                                    to: targetSquare,
                                    flags: 0
                                }));
                            // print(
                            // "(R) ${squareToAlgebraic(sourceSquare)} ${squareToAlgebraic(targetSquare)} piece quiet move\n");
                        } else {
                            // capture move
                            moves.push(new Move(
                                {
                                    piece: piece,
                                    from: sourceSquare,
                                    to: targetSquare,
                                    flags: MoveFlags.capture
                                }));
                            // print(
                            // "(R) ${squareToAlgebraic(sourceSquare)} ${squareToAlgebraic(targetSquare)} piece capture\n");
                        }

                        // pop ls1b in current attacks set
                        attacks = attacks.popBit(targetSquare);
                    }

                    // pop ls1b of the current piece bitboard copy
                    bitboard = bitboard.popBit(sourceSquare);
                }
            } else if (piece === PieceType.wQueen || piece === PieceType.bQueen) {
                // loop over source squares of piece bitboard copy
                while (bitboard.notEmpty) {
                    // init source square
                    sourceSquare = getLs1bIndex(bitboard.value);

                    // init piece attacks in order to get set of target squares
                    let attacks = getQueenAttacks(sourceSquare, this.allPieces).intersect(this.piecesOf(PieceType.side(piece)).complement());

                    // loop over target squares available from generated attacks
                    while (attacks.notEmpty) {
                        // init target square
                        targetSquare = getLs1bIndex(attacks.value);

                        // quite move
                        // if (!get_bit(((side === white) ? occupancies[black] : occupancies[white]), targetSquare))
                        if (!this.piecesOf(oppositeSide(PieceType.side(piece))).has(targetSquare)) {
                            moves.push(new Move(
                                {
                                    piece: piece,
                                    from: sourceSquare,
                                    to: targetSquare,
                                    flags: 0
                                }));
                            // print(
                            // "(Q) ${squareToAlgebraic(sourceSquare)} ${squareToAlgebraic(targetSquare)} piece quiet move\n");
                        } else {
                            // capture move
                            moves.push(new Move(
                                {
                                    piece: piece,
                                    from: sourceSquare,
                                    to: targetSquare,
                                    flags: MoveFlags.capture
                                }));
                            // print(
                            // "(Q) ${squareToAlgebraic(sourceSquare)} ${squareToAlgebraic(targetSquare)} piece capture\n");
                        }

                        // pop ls1b in current attacks set
                        attacks = attacks.popBit(targetSquare);
                    }

                    // pop ls1b of the current piece bitboard copy
                    bitboard = bitboard.popBit(sourceSquare);
                }
            } else if (piece === PieceType.wKing || piece === PieceType.bKing) {
                // loop over source squares of piece bitboard copy
                while (bitboard.notEmpty) {
                    // init source square
                    sourceSquare = getLs1bIndex(bitboard.value);
                    console.log("KING", piece, sourceSquare, bitboard);

                    // init piece attacks in order to get set of target squares
                    let attacks = new BitBoard(kingAttacks[Number(sourceSquare)] & ~this.piecesOf(PieceType.side(piece)).value);

                    // loop over target squares available from generated attacks
                    while (attacks.notEmpty) {
                        // init target square
                        targetSquare = getLs1bIndex(attacks.value);

                        console.log("new target square", targetSquare);
                        attacks.printBoard(true);

                        // quite move
                        // if (!get_bit(((side === white) ? occupancies[black] : occupancies[white]), targetSquare))
                        if (!this.piecesOf(oppositeSide(PieceType.side(piece))).has(targetSquare)) {
                            moves.push(new Move(
                                {
                                    piece: piece,
                                    from: sourceSquare,
                                    to: targetSquare,
                                    flags: 0
                                }));
                            // print(
                            // "(K) ${squareToAlgebraic(sourceSquare)} ${squareToAlgebraic(targetSquare)} piece quiet move\n");
                        } else {
                            // capture move
                            moves.push(new Move(
                                {
                                    piece: piece,
                                    from: sourceSquare,
                                    to: targetSquare,
                                    flags: MoveFlags.capture
                                }));
                            // print(
                            // "(K) ${squareToAlgebraic(sourceSquare)} ${squareToAlgebraic(targetSquare)} piece capture\n");
                        }

                        // pop ls1b in current attacks set
                        attacks = attacks.popBit(targetSquare);
                    }

                    // pop ls1b of the current piece bitboard copy
                    bitboard = bitboard.popBit(sourceSquare);
                }
            }
        }
        return moves;
    }

    toCopy(): BoardCopy {
        const clonedMap = new Map<PieceTypeValues, BitBoard>();

        this.pieceBitBoards.forEach((value, key) => {
            clonedMap.set(key, new BitBoard(value.value));
        });

        return new BoardCopy({
            pieceBitBoards: clonedMap,
            turn: this.turn,
            castlingRights: this.castlingRights,
            enPassant: this.enPassant,
            numOfMovesPlayed: this.movesPlayed
        });
    }

    revertTo(copy: BoardCopy) {
        this.pieceBitBoards.clear();

        for (const [key, value] of copy.pieceBitBoards) {
            this.pieceBitBoards.set(key, value);
        }
        // this.pieceBitBoards.addAll(copy.pieceBitBoards);
        this.turn = copy.turn;
        this.castlingRights = copy.castlingRights;
        this.enPassant = copy.enPassant;
    }

    generateLegalMoves(pseudoLegalMoves?: Move[]) {
        // Optionally let the user specify a pseudoLegalMoves cache to generate legal moves from
        const moves: Move[] = [];

        const copyOfBoard = this.toCopy();
        const currentTurn = copyOfBoard.turn;

        const whiteIsChecked = () => this.isSquareAttacked(getLs1bIndex(this.pieceBitBoards.get(PieceType.wKing)!.value), Side.black);
        const blackIsChecked = () => this.isSquareAttacked(getLs1bIndex(this.pieceBitBoards.get(PieceType.bKing)!.value), Side.white);

        for (const move of (pseudoLegalMoves ?? this.generatePseudoLegalMoves())) {
            this.makeMove(move, false);

            if (!(currentTurn === Side.white ? whiteIsChecked() : blackIsChecked())) {
                // If the king is not in check, it is a legal m}ove
                moves.push(move);
            }

            this.revertTo(copyOfBoard);
        }
        return moves;
    }

    makeMove(move: Move, validateSide: boolean) {
        assert((move.from < 64) && (move.from >= 0));
        assert((move.to < 64) && (move.to >= 0));

        if (validateSide) {
            if (this.turn !== PieceType.side(move.piece)) {
                throw Error("You can't move the pieces of the other side");
            }
        }

        handleCastling(this, move);

        // Handle captures except en passant
        handleCaptures(this, move);

        let bitBoard = this.pieceBitBoards.get(move.piece)!;
        bitBoard = bitBoard.popBit(move.from);
        bitBoard = bitBoard.setBit(move.to);
        this.pieceBitBoards.set(move.piece, bitBoard);

        handleEnPassant(this, move);
        handlePawnPromotion(this, move);

        if (validateSide) {
            this.halfMoveClock =
                (move.isCapture || (move.piece === PieceType.wPawn || move.piece === PieceType.bPawn)) ? 0n : this.halfMoveClock + 1n;

            if (PieceType.side(move.piece) !== Side.white) {
                this.movesPlayed++;
            }
        }

        this.turn = oppositeSide(this.turn);
    }
}

function handleCaptures(board: Board, move: Move) {
    if (move.isCapture && !move.isEnPassant) {
        const pieceWhichWasCut = board.getPieceInSquare(move.to)!;
        board.pieceBitBoards.set(pieceWhichWasCut,
            board.pieceBitBoards.get(pieceWhichWasCut)!.popBit(move.to));

        // Check if the square behind the piece which was captured is equal to Board.enPassant
        // if so, set Board.enPassant to null
        const oldEnPassant = (PieceType.side(move.piece) === Side.white) ? move.to - 8n : move.to + 8n;
        if (oldEnPassant == board.enPassant) {
            board.enPassant = undefined;
        }

        // Update castling rights incase of rook capture
        if (pieceWhichWasCut === PieceType.wRook || pieceWhichWasCut === PieceType.bRook) {
            if (PieceType.side(pieceWhichWasCut) == Side.white) {
                if ((move.to == BigInt(Squares.h1)) &&
                    ((board.castlingRights & CastlingRights.wKingSide) > 0)) {
                    board.castlingRights =
                        board.castlingRights ^ CastlingRights.wKingSide;
                } else if (move.to == BigInt(Squares.a1) &&
                    ((board.castlingRights & CastlingRights.wQueenSide) > 0)) {
                    board.castlingRights =
                        board.castlingRights ^ CastlingRights.wQueenSide;
                }
            } else {
                if (move.to == BigInt(Squares.h8) &&
                    ((board.castlingRights & CastlingRights.bKingSide) > 0)) {
                    board.castlingRights =
                        board.castlingRights ^ CastlingRights.bKingSide;
                } else if (move.to == BigInt(Squares.a8) &&
                    ((board.castlingRights & CastlingRights.bQueenSide) > 0)) {
                    board.castlingRights =
                        board.castlingRights ^ CastlingRights.bQueenSide;
                }
            }
        }
    }
}

function handleCastling(board: Board, move: Move) {
    // Handle castling
    if (move.isKingSideCastle || move.isQueenSideCastle) {
        const kingType =
            PieceType.side(move.piece) === Side.white ? PieceType.wKing : PieceType.bKing;
        const rookType =
            PieceType.side(move.piece) === Side.white ? PieceType.wRook : PieceType.bRook;
        let kingBitBoard = board.pieceBitBoards.get(kingType)!;

        kingBitBoard = kingBitBoard.setBit(move.to);
        kingBitBoard = kingBitBoard.popBit(move.from);
        board.pieceBitBoards.set(kingType, kingBitBoard);

        let rookBitBoard = board.pieceBitBoards.get(rookType)!;
        if (PieceType.side(move.piece) === Side.white) {
            // Handle castling of the white side
            board.castlingRights = board.castlingRights ^
                (CastlingRights.wKingSide | CastlingRights.wQueenSide);

            if (move.isKingSideCastle) {
                rookBitBoard = rookBitBoard
                    .setBit(BigInt(Squares.f1))
                    .popBit(BigInt(Squares.h1)); // White kingside
            } else {
                rookBitBoard = rookBitBoard
                    .setBit(BigInt(Squares.d1))
                    .popBit(BigInt(Squares.a1)); // white queenside
            }
        } else {
            // Handle castling of the black side
            board.castlingRights = board.castlingRights ^
                (CastlingRights.bKingSide | CastlingRights.bQueenSide);

            if (move.isKingSideCastle) {
                rookBitBoard = rookBitBoard
                    .setBit(BigInt(Squares.f8))
                    .popBit(BigInt(Squares.h8)); // black kingside
            } else {
                rookBitBoard = rookBitBoard
                    .setBit(BigInt(Squares.d8))
                    .popBit(BigInt(Squares.a8)); // black queenside
            }
        }

        board.pieceBitBoards.set(rookType, rookBitBoard);
    }

    // Update castling rights if king or rook is moved
    if (move.piece === PieceType.wKing || move.piece === PieceType.bKing) {
        if (PieceType.side(move.piece) === Side.white) {
            if ((board.castlingRights & CastlingRights.wKingSide) !== 0n) {
                board.castlingRights = board.castlingRights ^ CastlingRights.wKingSide;
            }
            if ((board.castlingRights & CastlingRights.wQueenSide) !== 0n) {
                board.castlingRights = board.castlingRights ^ CastlingRights.wQueenSide;
            }
        } else {
            if ((board.castlingRights & CastlingRights.bKingSide) !== 0n) {
                board.castlingRights = board.castlingRights ^ CastlingRights.bKingSide;
            }
            if ((board.castlingRights & CastlingRights.bQueenSide) !== 0n) {
                board.castlingRights = board.castlingRights ^ CastlingRights.bQueenSide;
            }
        }
    } else if (move.piece === PieceType.wRook || move.piece === PieceType.bRook) {
        if (PieceType.side(move.piece) === Side.white) {
            if (move.from == BigInt(Squares.h1)) {
                if ((board.castlingRights & CastlingRights.wKingSide) !== 0n) {
                    board.castlingRights =
                        board.castlingRights ^ CastlingRights.wKingSide;
                }
            } else if (move.from == BigInt(Squares.a1)) {
                if ((board.castlingRights & CastlingRights.wQueenSide) !== 0n) {
                    board.castlingRights =
                        board.castlingRights ^ CastlingRights.wQueenSide;
                }
            }
        } else {
            if (move.from == BigInt(Squares.h8)) {
                if ((board.castlingRights & CastlingRights.bKingSide) !== 0n) {
                    board.castlingRights =
                        board.castlingRights ^ CastlingRights.bKingSide;
                }
            } else if (move.from == BigInt(Squares.a8)) {
                if ((board.castlingRights & CastlingRights.bQueenSide) !== 0n) {
                    board.castlingRights =
                        board.castlingRights ^ CastlingRights.bQueenSide;
                }
            }
        }
    }
}

function handleEnPassant(board: Board, move: Move) {
    board.halfMoveClock = 0n;

    if (move.isDoublePush) {
        board.enPassant = (PieceType.side(move.piece) === Side.white) ? move.to + 8n : move.to - 8n;
    }

    if (move.isEnPassant) {
        const captureSquare =
            (PieceType.side(move.piece) === Side.white) ? board.enPassant! + 8n : board.enPassant! - 8n;
        const opponentPawnType =
            PieceType.side(move.piece) === Side.white ? PieceType.bPawn : PieceType.wPawn;

        board.pieceBitBoards.set(opponentPawnType,
            board.pieceBitBoards.get(opponentPawnType)!.popBit(captureSquare));
    }
    if (!move.isDoublePush) board.enPassant = undefined; // Reset en passant square
}

function handlePawnPromotion(board: Board, move: Move) {
    if (move.isPawnPromotion || move.isPawnPromotionCapture) {
        // Remove the pawn from the board
        board.pieceBitBoards.set(move.piece,
            board.pieceBitBoards.get(move.piece)!.popBit(move.to));

        // Set the new piece
        board.pieceBitBoards.set(move.promotedPiece!,
            board.pieceBitBoards.get(move.promotedPiece!)!.setBit(move.to));
    }
}
