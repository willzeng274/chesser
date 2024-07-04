import { BitBoard } from "./bitboard";

export function countBits(bitboard: bigint): bigint {
  let count = 0n;

  while (bitboard != 0n) {
    bitboard &= bitboard - 1n;
    count++;
  }
  return count;
}

export function getLs1bIndex(bitboard: bigint): bigint {
  // assert(bitboard != 0);
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

