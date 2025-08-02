/** @public */
export interface RevStartLength {
    readonly start: number;
    readonly length: number;
}

/** @public */
export namespace RevStartLength {
    export function createFromInclusiveFirstLast(first: number, last: number): RevStartLength {
        if (last >= first) {
            return {
                start: first,
                length: last - first + 1,
            };
        } else {
            return {
                start: first + 1,
                length: last - first - 1, // same as -(first + 1 - last)
            };
        }
    }

    export function ensureLengthIsNotNegative(startLength: RevStartLength): RevStartLength {
        const length = startLength.length;
        if (length >= 0) {
            return {
                start: startLength.start,
                length,
            };
        } else {
            return {
                start: startLength.start + length,
                length: -length,
            };
        }
    }
}
