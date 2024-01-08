export interface StartLength {
    readonly start: number;
    readonly length: number;
}

export namespace StartLength {
    export function createExclusiveFromFirstLast(first: number, last: number): StartLength {
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

    export function createFromExclusive(exclusive: StartLength): StartLength {
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
