export function assert(condition: boolean, message?: string) {
    if (!condition) {
        throw new Error(message);
    }
}

export function urs(x: bigint, s: bigint): bigint {
    // shift cannot be negative
    if (s <= 0n) {
        return x;
    } else {
        return (x >> s) & (0x7fffffffffffffffn >> (s - 1n));
    }
}