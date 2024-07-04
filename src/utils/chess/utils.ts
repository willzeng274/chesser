function countBits(bitboard: bigint): number {
  let count = 0;

  while (bitboard != 0n) {
    bitboard &= bitboard - 1n;
    count++;
  }
  return count;
}

export function getLs1bIndex(bitboard: bigint): number {
  // assert(bitboard != 0);
  return countBits((bitboard & -bitboard) - 1n);
}