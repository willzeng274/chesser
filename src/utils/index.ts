export function assert(condition: boolean, message?: string) {
    if (!condition) {
        throw new Error(message);
    }
}

export function ushr(x: bigint, n: bigint): bigint {
    if (n < 0) {
        throw new RangeError("Shift should not be negative");
    }
    // positive if number is negative (should NOT be possible)
    if (x < 0n) {
        x = x + (1n << (BigInt(n) + BigInt(x.toString(2).length)));
    }
    // 2^n
    const divisor = 2n ** BigInt(n);
    // unsigned right shift
    return x / divisor;
}