/**
 * @desc This object models selection of "cells" within an abstract single-dimensional matrix.
 *
 * Disjoint selections can be built with calls to the following methods:
 * * {@link RangesSelection#select|select(start, stop)} - Add a range to the matrix.
 * * {@link RangesSelection#deselect|deselect(start, stop)} - Remove a range from the matrix.
 *
 * Two more methods are available:
 * * Test a cell to see if it {@link RangesSelection#isSelected|isSelected(cell)}
 * * {@link RangesSelection#clear|clear()} the matrix
 *
 * Internally, the selection is run-length-encoded. It is therefore a "sparse" matrix
 * with undefined bounds. A single data property called `selection` is an array that
 * contains all the "ranges" of selected cells albeit in no particular order.
 * This property should not normally need to be accessed directly.
 */
export class RangesSelection {
    /**
     * @summary Unordered list of ranges.
     */
    ranges: RangesSelection.Range[];

    history: Array<RangesSelection.Range[]>;

    constructor() {
        this.ranges = [];

        //we need to be able to go back in time
        //the states field
        this.history = [];
    }

    /**
     * @summary Add a contiguous range of points to the selection.
     * @desc Insert a new range into `this.ranges`.
     * The new range will be merged with overlapping and adjacent ranges.
     *
     * The two parameters may be given in either order.
     * The start and stop elements in the resulting range will however always be ordered.
     * (However, note that the order of the ranges within `this.ranges` is itself always unordered.)
     *
     * Note that `this.range` is updated in place, preserving validity of any external references.
     * @param start - Start of range. May be greater than `stop`.
     * @param stop - End of range (inclusive). May be less than `start`.
     * @returns Self (i.e., `this`), for chaining.
     */
    select(start: number | RangesSelection.Range, stop?: number): RangesSelection {
        this.storeState();
        let range = makeRange(start, stop);
        const newSelection: RangesSelection.Range[] = [];
        this.ranges.forEach(function (each) {
            if (overlaps(each, range) || abuts(each, range)) {
                range = merge(each, range);
            } else {
                newSelection.push(each);
            }
        });
        newSelection.push(range);
        this.ranges.splice(0, this.ranges.length, ...newSelection); // update in place to preserve external references
        return this;
    }

    /**
     * @summary Remove a contiguous run of points from the selection.
     * @desc Truncate and/or remove range(s).
     * Removing part of existing ranges will (correctly) shorten them or break them into two fragments.
     *
     * The two parameters may be given in either order.
     *
     * Note that `this.ranges` is updated in place, preserving validity of any external references.
     * @param start - Start of range. May be greater than `stop`.
     * @param stop - End of range (inclusive). May be less than `start`.
     * @returns Self (i.e., `this`), for chaining.
     */
    deselect(start: number | RangesSelection.Range, stop?: number): RangesSelection {
        const range = makeRange(start, stop);
        let newSelection: RangesSelection.Range[] = [];
        this.ranges.forEach(function (each) {
            if (overlaps(each, range)) {
                const pieces = subtract(each, range);
                newSelection = newSelection.concat(pieces);
            } else {
                newSelection.push(each);
            }
        });
        this.ranges.splice(0, this.ranges.length, ...newSelection); // update in place to preserve external references
        return this;
    }

    /**
     * @summary Empties `this.ranges`, effectively removing all ranges.
     * @returns Self (i.e., `this`), for chaining.
     */
    clear(): RangesSelection {
        this.history.length = 0;
        this.ranges.length = 0;
        return this;
    }

    clearMostRecentSelection() {
        if (this.history.length === 0) {
            return;
        }
        this.ranges = this.history.pop();
    }

    /**
     * @summary Determines if the given `cell` is selected.
     * @returns `true` iff given `cell` is within any of the ranges in `this.ranges`.
     * @param cell - The cell to test for inclusion in the selection.
     */
    isSelected(cell: number): boolean {
        return this.ranges.some(
            (each) => {
                return each[0] <= cell && cell <= each[1];
            }
        );
    }

    isEmpty() {
        return this.ranges.length === 0;
    }

    /**
     * @summary Return the indexes that are selected.
     * @desc Return the indexes that are selected.
     */
    getSelectedIndices() {
        const result: number[] = [];
        this.ranges.forEach(
            (each) => {
                for (let i = each[0]; i <= each[1]; i++) {
                    result.push(i);
                }
            }
        );

        result.sort((a, b) => {
            return a - b;
        });

        return result;
    }

    getSelectedCount() {
        let result = 0;
        const ranges = this.ranges;
        for (const range of ranges) {
            result += range[1] - range[0] + 1;
        }
        return result;
    }

    //clone and store my current state
    //so we can unwind changes if need be
    storeState() {
        const ranges = this.ranges;
        const selection: RangesSelection.Range[] = [];
        for (let i = 0; i < ranges.length; i++) {
            const copy = ranges[i].slice() as RangesSelection.Range;
            // const copy = [].concat(sels[i]);
            selection.push(copy);
        }
        this.history.push(selection);
    }
}

export namespace RangesSelection {
    /**
     * A "range" is defined as an Array(2) where:
     * element [0] is the beginning of the range
     * element [1] is the end of the range (inclusive) and is always >= element [0]
     */
    export type InclusiveRange = [start: number, stop: number];
    export interface Range extends InclusiveRange {
        offsetY?: number;
    }
}

/**
 * @summary Preps `start` and `stop` params into order array
 * @desc Utility function called by both `select()` and `deselect()`.
 * @param start - Start of range. if array, `start` and `stop` are taken from first two elements.
 * @param stop - End of range (inclusive).
 */
function makeRange(start: number | RangesSelection.Range, stop?: number): RangesSelection.Range {
    return (
        start instanceof Array
            ? makeRange(start[0], start[1]) // extract params from given array
            : stop === undefined
                ? [ start, start ] // single param is a range that stops where it starts
                : start <= stop
                    ? [ start, stop ]
                    : [ stop, start ] // reverse descending params into ascending order
    );
}

/**
 * @private
 * @function overlaps
 * @returns {boolean} `true` iff `range1` overlaps `range2`
 * @summary Comparison operator that determines if given ranges overlap with one another.
 * @desc Both parameters are assumed to be _ordered_ arrays.
 *
 * Overlap is defined to include the case where one range completely contains the other.
 *
 * Note: This operator is commutative.
 * @param range1 - first range
 * @param range2 - second range
 */
function overlaps(range1: RangesSelection.Range, range2: RangesSelection.Range): boolean {
    return (
        range1[0] <= range2[0] && range2[0] <= range1[1] || // range2's start is within range1 OR...
        range1[0] <= range2[1] && range2[1] <= range1[1] || // range2's stop is within range1 OR...
        range2[0] <  range1[0] && range1[1] <  range2[1]    // range2 completely contains range1
    );
}

/**
 * @summary Comparison operator that determines if given ranges are consecutive with one another.
 * @returns `true` iff `range1` is consecutive with `range2`
 * @desc Both parameters are assumed to be _ordered_ arrays.
 *
 * Note: This operator is commutative.
 * @param range1 - first range
 * @param range2 - second range
 */
function abuts(range1: RangesSelection.Range, range2: RangesSelection.Range): boolean {
    return (
        range1[1] === range2[0] - 1 || // range1's top immediately precedes range2's start OR...
        range2[1] === range1[0] - 1    // range2's top immediately precedes range1's start
    );
}

/**
 * @summary Operator that subtracts one range from another.
 * @returns The remaining pieces of `minuend` after removing `subtrahend`.
 * @desc Both parameters are assumed to be _ordered_ arrays.
 *
 * This function _does not assumes_ that `overlap()` has already been called with the same ranges and has returned `true`.
 *
 * Returned array contains 0, 1, or 2 ranges which are the portion(s) of `minuend` that do _not_ include `subtrahend`.
 *
 * Caveat: This operator is *not* commutative.
 * @param minuend - a range from which to "subtract" `subtrahend`
 * @param subtrahend - a range to "subtracted" from `minuend`
 */
function subtract(minuend: RangesSelection.Range, subtrahend: RangesSelection.Range) {
    const m0 = minuend[0];
    const m1 = minuend[1];
    const s0 = subtrahend[0];
    const s1 = subtrahend[1];
    const result: RangesSelection.Range[] = [];

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
 * @summary Operator that merges given ranges.
 * @returns A single merged range.
 * @desc Both parameters are assumed to be _ordered_ arrays.
 *
 * The ranges are assumed to be overlapping or adjacent to one another.
 *
 * Note: This operator is commutative.
 * @param range1 - a range to merge with `range2`
 * @param range2 - a range to merge with `range1`
 */
function merge(range1: RangesSelection.Range, range2: RangesSelection.Range): RangesSelection.Range {
    const min = Math.min(Math.min(...range1), Math.min(...range2));
    const max = Math.max(Math.max(...range1), Math.max(...range2));
    return [min, max];
}

//     // Interface
//     module.exports = RangeSelectionModel;
// })(
//     typeof module === 'object' && module || (window.RangeSelectionModel = {}),
//     typeof module === 'object' && module.exports || (window.RangeSelectionModel.exports = {})
// ) || (
//     typeof module === 'object' || (window.RangeSelectionModel = window.RangeSelectionModel.exports)
// );

/* About the above IIFE:
 * This file is a "modified node module." It functions as usual in Node.js *and* is also usable directly in the browser.
 * 1. Node.js: The IIFE is superfluous but innocuous.
 * 2. In the browser: The IIFE closure serves to keep internal declarations private.
 * 2.a. In the browser as a global: The logic in the actual parameter expressions + the post-invocation expression
 * will put your API in `window.RangeSelectionModel`.
 * 2.b. In the browser as a module: If you predefine a `window.module` object, the results will be in `module.exports`.
 * The bower component `mnm` makes this easy and also provides a global `require()` function for referencing your module
 * from other closures. In either case, this works with both NodeJs-style export mechanisms -- a single API assignment,
 * `module.exports = yourAPI` *or* a series of individual property assignments, `module.exports.property = property`.
 *
 * Before the IIFE ranges, the actual parameter expressions are executed:
 * 1. If `window` object undefined, we're in NodeJs so assume there is a `module` object with an `exports` property
 * 2. If `window` object defined, we're in browser
 * 2.a. If `module` object predefined, use it
 * 2.b. If `module` object undefined, create a `RangeSelectionModel` object
 *
 * After the IIFE returns:
 * Because it always returns undefined, the expression after the || will execute:
 * 1. If `window` object undefined, then we're in NodeJs so we're done
 * 2. If `window` object defined, then we're in browser
 * 2.a. If `module` object predefined, we're done; results are in `moudule.exports`
 * 2.b. If `module` object undefined, redefine`RangeSelectionModel` to be the `RangeSelectionModel.exports` object
 */
