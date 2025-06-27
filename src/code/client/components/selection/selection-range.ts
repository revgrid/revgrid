
/**
 * A "range" is defined as an Array(2) where:
 * element [0] is the beginning of the range
 * element [1] is the end of the range (inclusive) and is always \>= element [0]
 */
export type RevSelectionInclusiveRange = [start: number, stop: number];
export interface RevSelectionRange extends RevSelectionInclusiveRange {
    offsetY?: number;
}

export namespace RevSelectionRange {
    /**
     * Preps `start` and `stop` params into order array
     * @remarks Utility function called by both `select()` and `deselect()`.
     */
    export function make(start: number, count: number): RevSelectionRange {
        return [start, start + count - 1];
    }

    export function copy(other: RevSelectionRange): RevSelectionRange {
        return [other[0], other[1]];
    }

    /**
     * @returns `true` iff `range1` overlaps `range2`
     * Comparison operator that determines if given ranges overlap with one another.
     * @remarks Both parameters are assumed to be _ordered_ arrays.
     *
     * Overlap is defined to include the case where one range completely contains the other.
     *
     * Note: This operator is commutative.
     * @param range1 - first range
     * @param range2 - second range
     */
    export function overlaps(range1: RevSelectionRange, range2: RevSelectionRange): boolean {
        return (
            range1[0] <= range2[0] && range2[0] <= range1[1] || // range2's start is within range1 OR...
            range1[0] <= range2[1] && range2[1] <= range1[1] || // range2's stop is within range1 OR...
            range2[0] <  range1[0] && range1[1] <  range2[1]    // range2 completely contains range1
        );
    }

    /**
     * Comparison operator that determines if given ranges are consecutive with one another.
     * @returns `true` iff `range1` is consecutive with `range2`
     * @remarks Both parameters are assumed to be _ordered_ arrays.
     *
     * Note: This operator is commutative.
     * @param range1 - first range
     * @param range2 - second range
     */
    export function abuts(range1: RevSelectionRange, range2: RevSelectionRange): boolean {
        return (
            range1[1] === range2[0] - 1 || // range1's top immediately precedes range2's start OR...
            range2[1] === range1[0] - 1    // range2's top immediately precedes range1's start
        );
    }

    /**
     * Operator that subtracts one range from another.
     * @returns The remaining pieces of `minuend` after removing `subtrahend`.
     * @remarks Both parameters are assumed to be _ordered_ arrays.
     *
     * This function _does not assumes_ that `overlap()` has already been called with the same ranges and has returned `true`.
     *
     * Returned array contains 0, 1, or 2 ranges which are the portion(s) of `minuend` that do _not_ include `subtrahend`.
     *
     * Caveat: This operator is *not* commutative.
     * @param minuend - a range from which to "subtract" `subtrahend`
     * @param subtrahend - a range to "subtracted" from `minuend`
     */
    export function subtract(minuend: RevSelectionRange, subtrahend: RevSelectionRange) {
        const m0 = minuend[0];
        const m1 = minuend[1];
        const s0 = subtrahend[0];
        const s1 = subtrahend[1];
        const result: RevSelectionRange[] = [];

        if (s0 <= m0 && s1 < m1) {
            //subtrahend extends before minuend: return remaining piece of `minuend`
            result.push([s1 + 1, m1]);
        } else if (s0 > m0 && s1 >= m1) {
            //subtrahend extends after minuend: return remaining piece of `minuend`
            result.push([m0, s0 - 1]);
        } else if (m0 < s0 && s1 < m1) {
            //completely inside: return 2 smaller pieces resulting from the hole
            result.push([m0, s0 - 1]);
            result.push([s1 + 1, m1]);
        } else if (s1 < m0 || s0 > m1) {
            // completely outside: return `minuend` untouched
            result.push(minuend);
        }

        //else subtrahend must completely overlap minuend so return no pieces

        return result;
    }


    // Local utility functions

    /**
     * Operator that merges given ranges.
     * @returns A single merged range.
     * @remarks Both parameters are assumed to be _ordered_ arrays.
     *
     * The ranges are assumed to be overlapping or adjacent to one another.
     *
     * Note: This operator is commutative.
     * @param range1 - a range to merge with `range2`
     * @param range2 - a range to merge with `range1`
     */
    export function merge(range1: RevSelectionRange, range2: RevSelectionRange): RevSelectionRange {
        const min = Math.min(Math.min(...range1), Math.min(...range2));
        const max = Math.max(Math.max(...range1), Math.max(...range2));
        return [min, max];
    }

    /**
     * Comparison operator that determines if outerRange completely contains a range.
     * @returns `true` iff `outerRange` completely contains `range`
     * @remarks Both parameters are assumed to be _ordered_ arrays.
     */
    export function contains(outerRange: RevSelectionRange, range: RevSelectionRange) {
        return range[0] >= outerRange[0] && range[1] <= outerRange[1];
    }
}
