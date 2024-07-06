import { assert } from "..";
import { BitBoard } from "./bitboard";
import {CastlingRights} from "./constants"

export function countBits(bitboard: bigint): bigint {
  let count = 0n;

  while (bitboard !== 0n) {
    bitboard &= bitboard - 1n;
    count++;
  }
  return count;
}

export function getLs1bIndex(bitboard: bigint): bigint {
  // assert(bitboard !== 0);
  return countBits((bitboard & -bitboard) - 1n);
}

export function bigIntFloorDivision(a: bigint, b: bigint): bigint {
  const result = a / b;
  if (result >= 0n) {
      return result;
  } else {
      return result - 1n;
  }
}


export function setOccupancy(index: bigint, bitsInMask: bigint, attackMask: BitBoard): BitBoard {
  let occupancy = new BitBoard(0n);

  // loop over the range of bits within attack mask
  for (let count = 0n; count < bitsInMask; count++) {
    // get LS1B index of attacks mask
    const square = getLs1bIndex(attackMask.value);

    // pop LS1B in attack map
    attackMask = attackMask.popBit(square);

    // make sure occupancy is on board
    if ((index & (1n << count)) > 0) {
      // populate occupancy map
      occupancy = occupancy.union(new BitBoard(1n << square));
    }
  }

  return occupancy;
}


export function squareToAlgebraic(square: bigint) {
  assert(square >= 0 && square < 64);
  return squareToCoord[Number(square)];
}

export function squareFromAlgebraic(str: string) {
  if (str.length > 2) return null;

  const file = fileNames.indexOf(str[0]);
  const rank = parseInt(str[1]);

  if (rank == null) return null;

  const square = (8 - rank) * 8 + file;

  if (square > 63) {
    return null;
  }

  return BigInt(square);
}

const fileNames = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const squareToCoord = [
  "a8",
  "b8",
  "c8",
  "d8",
  "e8",
  "f8",
  "g8",
  "h8",
  "a7",
  "b7",
  "c7",
  "d7",
  "e7",
  "f7",
  "g7",
  "h7",
  "a6",
  "b6",
  "c6",
  "d6",
  "e6",
  "f6",
  "g6",
  "h6",
  "a5",
  "b5",
  "c5",
  "d5",
  "e5",
  "f5",
  "g5",
  "h5",
  "a4",
  "b4",
  "c4",
  "d4",
  "e4",
  "f4",
  "g4",
  "h4",
  "a3",
  "b3",
  "c3",
  "d3",
  "e3",
  "f3",
  "g3",
  "h3",
  "a2",
  "b2",
  "c2",
  "d2",
  "e2",
  "f2",
  "g2",
  "h2",
  "a1",
  "b1",
  "c1",
  "d1",
  "e1",
  "f1",
  "g1",
  "h1",
];

export function castlingRightsFromStr(rightsStr: string) {
  let rights = 0n;

  if (rightsStr == "-") return 0n;

  if (rightsStr.includes("K")) {
    rights |= CastlingRights.wKingSide;
  }
  if (rightsStr.includes("Q")) {
    rights |= CastlingRights.wQueenSide;
  }
  if (rightsStr.includes("k")) {
    rights |= CastlingRights.bKingSide;
  }
  if (rightsStr.includes("q")) {
    rights |= CastlingRights.bQueenSide;
  }

  return rights;
}