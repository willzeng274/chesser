import { assert, urs } from "..";
import "./constants.ts";
import { PieceTypeValues, Side } from "./constants.ts";

export class BitBoard {
    value: bigint;

    constructor(value: bigint) {
        const mask = (1n << 64n) - 1n;
        this.value = value & mask;
        // return value & mask;
        // this.value = (
        //     value === (-1n << 65n) ||
        //     value === (1n << 65n) ||
        //     value === (-1n << 64n) ||
        //     value === (1n << 64n)
        //     // value === (1n << 63n) ||
        //     // value === (-1n << 63n)
        // ) ? 0n : value;
    }

    static readonly full = new BitBoard(0xffffffffffffffffn);
    static readonly lightSquares = new BitBoard(0x55AA55AA55AA55AAn);
    static readonly darkSquares = new BitBoard(0xAA55AA55AA55AA55n);
    static readonly diagonal = new BitBoard(0x8040201008040201n);
    static readonly antidiagonal = new BitBoard(0x0102040810204080n);
    static readonly corners = new BitBoard(0x8100000000000081n);
    static readonly center = new BitBoard(0x0000001818000000n);
    static readonly backranks = new BitBoard(0xff000000000000ffn);

    setBit(square: bigint): BitBoard {
        assert(square >= 0n && square < 64n);
        return new BitBoard(this.value | (1n << square));
    }

    getBit(square: bigint): bigint {
        assert(square >= 0n && square < 64n);
        return (this.value >> square) & 1n;
    }

    has(square: bigint): boolean {
        assert(square >= 0n && square < 64n);
        return this.getBit(square) === 1n;
    }

    popBit(square: bigint): BitBoard {
        assert(square >= 0n && square < 64n);
        // if (square === 56n) {
        //     console.log("popping bit", ~(1n << (square)));
        //     console.log("this.value", this.value);
        //     console.log("AND", this.value & ~(1n << (square)));
        // }
        return new BitBoard(this.value & ~(1n << (square)));
    }

    /// Bitwise right shift, operator >>
    // actually doing unsigned right shift
    shr(shift: bigint): BitBoard {
        if (shift >= 64n) return new BitBoard(0n);
        if (shift > 0n) return new BitBoard(urs(this.value, shift));
        return this;
    }

    /// Bitwise left shift, operator <<
    shl(shift: bigint): BitBoard {
        if (shift >= 64n) return new BitBoard(0n);
        if (shift > 0n) return new BitBoard(this.value << shift);
        return this;
    }

    neg(): BitBoard {
        return new BitBoard(-this.value);
    }

    xor(other: BitBoard): BitBoard {
        return new BitBoard(this.value ^ other.value);
    }

    union(other: BitBoard): BitBoard {
        return new BitBoard(this.value | other.value);
    }

    intersect(other: BitBoard): BitBoard {
        return new BitBoard(this.value & other.value);
    }

    minus(other: BitBoard): BitBoard {
        return new BitBoard(this.value - other.value);
    }

    complement(): BitBoard {
        return new BitBoard(~this.value);
    }

    multiply(other: bigint): BitBoard {
        return new BitBoard(this.value * other);
    }

    diff(other: BitBoard): BitBoard {
        return new BitBoard(this.value & ~other.value);
    }

    equals(other: object): boolean {
        return this === other ||
            other instanceof BitBoard &&
            other.value === this.value;
    }

    toString(): string {
        return `BitBoard(${this.value})`;
    }

    get notEmpty(): boolean {
        return this.value !== 0n;
    }

    printBoard(showBoardValue = false) {
        let buffer = '';

        for (let rank = 0n; rank < 8n; rank++) {
            for (let file = 0n; file < 8n; file++) {
                const square = rank * 8n + file;

                if (file === 0n) {
                    buffer += (`${8n - rank}  | `);
                }

                buffer += this.getBit(square).toString() + ' ';
            }
            buffer += '\n';
        }

        buffer += '   ------------------';
        buffer += '\n     a b c d e f g h\n';

        console.log(buffer);

        if (showBoardValue) {
            console.log(`\nBitBoard Value: ${this.value}\n`);
        }
    }
}

export interface BoardCopyArgs {
    pieceBitBoards: Map<PieceTypeValues, BitBoard>;
    turn: Side;
    castlingRights: bigint;
    enPassant: bigint | undefined;
    numOfMovesPlayed: bigint;
}

export class BoardCopy {
    pieceBitBoards: Map<PieceTypeValues, BitBoard>;
    turn: Side;
    castlingRights: bigint;
    enPassant: bigint | undefined;
    numOfMovesPlayed: bigint;

    constructor({
        pieceBitBoards,
        turn,
        castlingRights,
        enPassant,
        numOfMovesPlayed
    }: BoardCopyArgs) {
        this.pieceBitBoards = pieceBitBoards;
        this.turn = turn;
        this.castlingRights = castlingRights;
        this.enPassant = enPassant;
        this.numOfMovesPlayed = numOfMovesPlayed;
    }
}

// Bitboard constants

// Represents a board with all bits set to 1 except the bits in the A file
export const NOT_A_FILE = new BitBoard(0xFEFEFEFEFEFEFEFEn);

// A board with all bits set to 1 except the bits in the A file and the B file
export const NOT_AB_FILE = new BitBoard(0xFCFCFCFCFCFCFCFCn);

// Board with all bits set to 1 except the bits in the H file
export const NOT_H_FILE = new BitBoard(0x7F7F7F7F7F7F7F7Fn);

// A board with all bits set to 1 except the bits in the H file and the G file
export const NOT_HG_FILE = new BitBoard(0x3F3F3F3F3F3F3F3Fn);