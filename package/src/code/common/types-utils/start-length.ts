/** @public */
export interface RevStartLength {
    readonly start: number;
    readonly length: number;
}

/** @public */
export namespace RevStartLength {
    export function createExclusiveFromFirstLast(first: number, last: number): RevStartLength {
        if (last >= first) {
            return {
                start: first,
                length: last - first + 1,
            };
        } else {
            return {
                start: first + 1,
                length: last - first - 1, // same as -(first - (last - 1))
            };
        }
    }

    export function createFromExclusive(exclusive: RevStartLength): RevStartLength {
        const length = exclusive.length;
        if (length >= 0) {
            return {
                start: exclusive.start,
                length,
            };
        } else {
            return {
                start: exclusive.start + length,
                length: -length,
            };
        }
    }
}
