import { BitBoard, NOT_A_FILE, NOT_AB_FILE, NOT_H_FILE, NOT_HG_FILE } from "./bitboard";
import { bishopRelevantBits, rookRelevantBits, Side } from "./constants";
import { bishopMagicNumbers, rookMagicNumbers } from "./magic_numbers";
import { bigIntFloorDivision, countBits, setOccupancy } from "./utils"

export const pawnAttacks = [
    Array(64).fill(0n), // White pawns
    Array(64).fill(0n) // Black pawns
];

export const kingAttacks = Array(64).fill(0n);
export const knightAttacks = Array(64).fill(0n);
export const bishopMasks = Array(64).fill(0n);
export const rookMasks = Array(64).fill(0n);

export const bishopAttacks: Array<Map<bigint, bigint>> = Array(64).fill(new Map());
export const rookAttacks: Array<Map<bigint, bigint>> = Array(64).fill(new Map());

function maskPawnAttacks(square: bigint, side: Side): bigint {
    const bitboard = new BitBoard(0n).setBit(square);
    let attacks = new BitBoard(0n);

    if (side === Side.white) {
        if (bitboard.shr(7n).intersect(NOT_A_FILE).notEmpty) attacks = attacks.union(bitboard.shr(7n));
        if (bitboard.shr(9n).intersect(NOT_H_FILE).notEmpty) attacks = attacks.union(bitboard.shr(9n));
    } else {
        if (bitboard.shl(7n).intersect(NOT_H_FILE).notEmpty) attacks = attacks.union(bitboard.shl(7n));
        if (bitboard.shl(9n).intersect(NOT_A_FILE).notEmpty) attacks = attacks.union(bitboard.shl(9n));
    }

    return attacks.value;
}

function maskKnightAttacks(square: bigint): bigint {
    const bitboard = new BitBoard(0n).setBit(square);
    let attacks = new BitBoard(0n);

    if (bitboard.shr(17n).intersect(NOT_H_FILE).notEmpty) attacks = attacks.union(bitboard.shr(17n));
    if (bitboard.shr(15n).intersect(NOT_A_FILE).notEmpty) attacks = attacks.union(bitboard.shr(15n));
    if (bitboard.shr(10n).intersect(NOT_HG_FILE).notEmpty) attacks = attacks.union(bitboard.shr(10n));
    if (bitboard.shr(6n).intersect(NOT_AB_FILE).notEmpty) attacks = attacks.union(bitboard.shr(6n));
    if (bitboard.shl(17n).intersect(NOT_A_FILE).notEmpty) attacks = attacks.union(bitboard.shl(17n));
    if (bitboard.shl(15n).intersect(NOT_H_FILE).notEmpty) attacks = attacks.union(bitboard.shl(15n));
    if (bitboard.shl(10n).intersect(NOT_AB_FILE).notEmpty) attacks = attacks.union(bitboard.shl(10n));
    if (bitboard.shl(6n).intersect(NOT_HG_FILE).notEmpty) attacks = attacks.union(bitboard.shl(6n));

    return attacks.value;
}

function maskKingAttacks(square: bigint): bigint {
    const bitboard = new BitBoard(0n).setBit(square);
    let attacks = new BitBoard(0n);

    if (bitboard.shr(8n).notEmpty) attacks = attacks.union(bitboard.shr(8n));
    if (bitboard.shr(9n).intersect(NOT_H_FILE).notEmpty) attacks = attacks.union(bitboard.shr(9n));
    if (bitboard.shr(7n).intersect(NOT_A_FILE).notEmpty) attacks = attacks.union(bitboard.shr(7n));
    if (bitboard.shr(1n).intersect(NOT_H_FILE).notEmpty) attacks = attacks.union(bitboard.shr(1n));
    if (bitboard.shl(8n).notEmpty) attacks = attacks.union(bitboard.shl(8n));
    if (bitboard.shl(9n).intersect(NOT_A_FILE).notEmpty) attacks = attacks.union(bitboard.shl(9n));
    if (bitboard.shl(7n).intersect(NOT_HG_FILE).notEmpty) attacks = attacks.union(bitboard.shl(7n));
    if (bitboard.shl(1n).intersect(NOT_A_FILE).notEmpty) attacks = attacks.union(bitboard.shl(1n));

    return attacks.value;

    //   if ((bitboard >> 8).notEmpty) attacks |= (bitboard >> 8);
    //   if (((bitboard >> 9) & NOT_H_FILE).notEmpty) attacks |= (bitboard >> 9);
    //   if (((bitboard >> 7) & NOT_A_FILE).notEmpty) attacks |= (bitboard >> 7);
    //   if (((bitboard >> 1) & NOT_H_FILE).notEmpty) attacks |= (bitboard >> 1);
    //   if ((bitboard << 8).notEmpty) attacks |= (bitboard << 8);
    //   if (((bitboard << 9) & NOT_A_FILE).notEmpty) attacks |= (bitboard << 9);
    //   if (((bitboard << 7) & NOT_H_FILE).notEmpty) attacks |= (bitboard << 7);
    //   if (((bitboard << 1) & NOT_A_FILE).notEmpty) attacks |= (bitboard << 1);

    //   return attacks.value;
}

function bigIntModulus(a: bigint, b: bigint): bigint {
    let result = a % b;

    if (result < 0n) {
        result += (b < 0n ? -b : b);
    }

    return result;
}

function maskBishopAttacks(square: bigint): bigint {
    let attacks = 0n;

    const tr = bigIntFloorDivision(square, 8n);
    const tf = bigIntModulus(square, 8n);

    for (let r = tr + 1n, f = tf + 1n; r <= 6n && f <= 6n; r++, f++) {
        attacks |= 1n << (r * 8n + f);
    }

    for (let r = tr - 1n, f = tf + 1n; r >= 1n && f <= 6n; r--, f++) {
        attacks |= 1n << (r * 8n + f);
    }

    for (let r = tr + 1n, f = tf - 1n; r <= 6n && f >= 1n; r++, f--) {
        attacks |= 1n << (r * 8n + f);
    }

    for (let r = tr - 1n, f = tf - 1n; r >= 1n && f >= 1n; r--, f--) {
        attacks |= 1n << (r * 8n + f);
    }

    return attacks;
}

function maskRookAttacks(square: bigint): bigint {
    let attacks = new BitBoard(0n);

    const tr = bigIntFloorDivision(square, 8n);
    const tf = bigIntModulus(square, 8n);

    for (let r = tr + 1n; r <= 6n; r++) {
        attacks = attacks.union(new BitBoard(1n << (r * 8n + tf)));
    }
    for (let r = tr - 1n; r >= 1n; r--) {
        attacks = attacks.union(new BitBoard(1n << (r * 8n + tf)));
    }
    for (let f = tf + 1n; f <= 6n; f++) {
        attacks = attacks.union(new BitBoard(1n << (tr * 8n + f)));
    }
    for (let f = tf - 1n; f >= 1n; f--) {
        attacks = attacks.union(new BitBoard(1n << (tr * 8n + f)));
    }

    return attacks.value;
}

function genBishopAttacksOnTheFly(square: bigint, blockers: bigint): bigint {
    // result attacks bitboard
    let attacks = new BitBoard(0n);

    // init target rank & files
    const tr = bigIntFloorDivision(square, 8n);
    const tf = bigIntModulus(square, 8n);

    // generate bishop atacks
    for (let r = tr + 1n, f = tf + 1n; r <= 7n && f <= 7n; r++, f++) {
        attacks = attacks.union(new BitBoard(1n << (r * 8n + f)));
        if (((1n << (r * 8n + f)) & blockers) > 0n) break;
    }

    for (let r = tr - 1n, f = tf + 1n; r >= 0n && f <= 7n; r--, f++) {
        attacks = attacks.union(new BitBoard(1n << (r * 8n + f)));
        if (((1n << (r * 8n + f)) & blockers) > 0n) break;
    }

    for (let r = tr + 1n, f = tf - 1n; r <= 7n && f >= 0n; r++, f--) {
        attacks = attacks.union(new BitBoard(1n << (r * 8n + f)));
        if (((1n << (r * 8n + f)) & blockers) > 0n) break;
    }

    for (let r = tr - 1n, f = tf - 1n; r >= 0n && f >= 0n; r--, f--) {
        attacks = attacks.union(new BitBoard(1n << (r * 8n + f)));
        if (((1n << (r * 8n + f)) & blockers) > 0n) break;
    }

    // return attack map
    return attacks.value;
}

function genRookAttacksOnTheFly(square: bigint, blockers: bigint): bigint {
    let attacks = new BitBoard(0n);

    // init target rank & files
    const tr = bigIntFloorDivision(square, 8n);
    const tf = bigIntModulus(square, 8n);

    // generate rook attacks
    for (let r = tr + 1n; r <= 7n; r++) {
        attacks = attacks.union(new BitBoard(1n << (r * 8n + tf)));
        if (((1n << (r * 8n + tf)) & blockers) > 0n) break;
    }

    for (let r = tr - 1n; r >= 0; r--) {
        attacks = attacks.union(new BitBoard(1n << (r * 8n + tf)));
        if (((1n << (r * 8n + tf)) & blockers) > 0n) break;
    }

    for (let f = tf + 1n; f <= 7; f++) {
        attacks = attacks.union(new BitBoard(1n << (tr * 8n + f)));
        if (((1n << (tr * 8n + f)) & blockers) > 0n) break;
    }

    for (let f = tf - 1n; f >= 0; f--) {
        attacks = attacks.union(new BitBoard(1n << (tr * 8n + f)));
        if (((1n << (tr * 8n + f)) & blockers) > 0n) break;
    }

    // return attack map
    return attacks.value;
}

function initSliderAttacks(isBishop: boolean) {


    // loop over 64 board squares
    for (let square = 0n; square < 64n; square++) {
        const squareNum = Number(square)
        bishopMasks[squareNum] = maskBishopAttacks(square);
        rookMasks[squareNum] = maskRookAttacks(square);

        // Get current attack mask
        const attackMask = new BitBoard(isBishop ? bishopMasks[squareNum] : rookMasks[squareNum]);

        const relevantBitsCount: bigint = countBits(attackMask.value);
        const occupancyIndicies: bigint = (1n << relevantBitsCount);

        for (let index = 0n; index < occupancyIndicies; index++) {
            if (isBishop) {
                // Bishop
                // Get the current occupancy variation
                const occupancy = setOccupancy(index, relevantBitsCount, attackMask).value;

                // Initialize magic index
                const magicIndex = (occupancy * bishopMagicNumbers[squareNum]) >>
                    (64n - bishopRelevantBits[squareNum]);

                // Set the bishop attacks
                bishopAttacks[squareNum].set(magicIndex, genBishopAttacksOnTheFly(square, occupancy));
            } else {
                // Rook
                // Get the current occupancy variation
                const occupancy = setOccupancy(index, relevantBitsCount, attackMask).value;

                // Initialize magic index
                const magicIndex = (occupancy * rookMagicNumbers[squareNum]) >>
                    (64n - rookRelevantBits[squareNum]);

                // Set the rook attacks
                rookAttacks[squareNum].set(magicIndex, genRookAttacksOnTheFly(square, occupancy));
            }
        }
    }
}

export function getBishopAttacks(square: bigint, occupancy: BitBoard): BitBoard {
    const squareNum = Number(square);
    // get bishop attacks assuming current board occupancy
    let occ = occupancy.value;
    occ &= bishopMasks[squareNum];
    occ *= bishopMagicNumbers[squareNum];
    occ >>= 64n - bishopRelevantBits[squareNum];

    return new BitBoard(bishopAttacks[squareNum].get(occ)!);
}

export function getRookAttacks(square: bigint, occupancy: BitBoard): BitBoard {
    const squareNum = Number(square);
    // get rook attacks assuming current board occupancy
    let occ = occupancy.value;
    occ &= rookMasks[squareNum];
    occ *= rookMagicNumbers[squareNum];
    occ >>= 64n - rookRelevantBits[squareNum];

    return new BitBoard(rookAttacks[squareNum].get(occ)!);
}

export function getQueenAttacks(square: bigint, occupancy: BitBoard): BitBoard {
    return getBishopAttacks(square, occupancy).union(getRookAttacks(square, occupancy));
}

export function initAttacks() {
    for (let square = 0n; square < 64n; square++) {
        const squareNum = Number(square);
        // We also need to mask attacks for the 1th and 8th ranks
        pawnAttacks[0][squareNum] = maskPawnAttacks(square, Side.white);
        pawnAttacks[1][squareNum] = maskPawnAttacks(square, Side.black);

        knightAttacks[squareNum] = maskKnightAttacks(square);

        kingAttacks[squareNum] = maskKingAttacks(square);
    }

    initSliderAttacks(true);
    initSliderAttacks(false);
}