import { ContiguousIndexRangeList } from './contiguous-index-range-list';
import { SelectionAreaList } from './selection-area-list';

/**
 * This object models selection of "cells" within an abstract single-dimensional matrix.
 *
 * @remarks
 * Disjoint selections can be built with calls to the following methods:
 * * {@link SelectionRangeList#select|select(start, stop)} - Add a range to the matrix.
 * * {@link SelectionRangeList#deselect|deselect(start, stop)} - Remove a range from the matrix.
 *
 * Two more methods are available:
 * * Test a cell to see if it {@link SelectionRangeList#isSelected|isSelected(cell)}
 * * {@link SelectionRangeList#clear|clear()} the matrix
 *
 * Internally, the selection is run-length-encoded. It is therefore a "sparse" matrix
 * with undefined bounds. A single data property called `selection` is an array that
 * contains all the "ranges" of selected cells albeit in no particular order.
 * This property should not normally need to be accessed directly.
 */
export class SelectionRangeList extends ContiguousIndexRangeList implements SelectionAreaList {
    // readonly ranges = new Array<ContiguousIndexRange>(0);

    get areaCount() { return this.ranges.length; }

    /**
     * Add a contiguous range of points to the selection.
     * @remarks Insert a new range into `this.ranges`.
     * The new range will be merged with overlapping and adjacent ranges.
     *
     * The two parameters may be given in either order.
     * The start and stop elements in the resulting range will however always be ordered.
     * (However, note that the order of the ranges within `this.ranges` is itself always unordered.)
     *
     * Note that `this.range` is updated in place, preserving validity of any external references.
     * @param start - Start of range. May be greater than `stop`.
     * @param stop - End of range (inclusive). May be less than `start`.
     * @returns true if this.ranges was changed.
     */
    // select(start: number, count: number): boolean {
    //     if (count <= 0) {
    //         return false;
    //     } else {
    //         let newRange = SelectionRange.make(start, count);
    //         const newSelection: SelectionRange[] = [];
    //         for (const range of this.ranges) {
    //             if (SelectionRange.contains(range, newRange)) {
    //                 return false;
    //             } else {
    //                 if (SelectionRange.overlaps(range, newRange) || SelectionRange.abuts(range, newRange)) {
    //                     newRange = SelectionRange.merge(range, newRange);
    //                 } else {
    //                     newSelection.push(range);
    //                 }
    //             }
    //         }
    //         newSelection.push(newRange);
    //         this.ranges.splice(0, this.ranges.length, ...newSelection); // update in place to preserve external references
    //         return true;
    //     }
    // }

    /**
     * Remove a contiguous run of points from the selection.
     * @remarks Truncate and/or remove range(s).
     * Removing part of existing ranges will (correctly) shorten them or break them into two fragments.
     *
     * The two parameters may be given in either order.
     *
     * Note that `this.ranges` is updated in place, preserving validity of any external references.
     * @param start - Start of range. May be greater than `stop`.
     */
    // deselect(start: number, count: number) {
    //     const deselectRange = SelectionRange.make(start, count);
    //     let changed = false;
    //     let newSelection: SelectionRange[] = [];
    //     this.ranges.forEach((range) => {
    //         if (SelectionRange.overlaps(range, deselectRange)) {
    //             const pieces = SelectionRange.subtract(range, deselectRange);
    //             newSelection = [...newSelection, ...pieces];
    //             changed = true;
    //         } else {
    //             newSelection.push(range);
    //         }
    //     });
    //     this.ranges.splice(0, this.ranges.length, ...newSelection); // update in place to preserve external references
    //     return changed;
    // }

    /**
     * Empties `this.ranges`, effectively removing all ranges.
     * @returns Self (i.e., `this`), for chaining.
     */
    // clear() {
    //     this.ranges.length = 0;
    // }

    /**
     * Determines if the given `cell` is selected.
     * @returns `true` iff given `cell` is within any of the ranges in `this.ranges`.
     * @param index - The cell to test for inclusion in the selection.
     */
    // isSelected(index: number): boolean {
    //     return this.ranges.some(
    //         (range) => {
    //             return range[0] <= index && index <= range[1];
    //         }
    //     );
    // }

    // isEmpty() {
    //     return this.ranges.length === 0;
    // }

    /**
     * Return the indexes that are selected.
     * @remarks Return the indexes that are selected.
     */
    // getIndices() {
    //     const result: number[] = [];
    //     this.ranges.forEach(
    //         (range) => {
    //             const rangeStop = range[1];
    //             for (let i = range[0]; i <= rangeStop; i++) {
    //                 result.push(i);
    //             }
    //         }
    //     );

    //     result.sort((a, b) => {
    //         return a - b;
    //     });

    //     return result;
    // }

    // getCount() {
    //     let result = 0;
    //     const ranges = this.ranges;
    //     for (const range of ranges) {
    //         result += (range[1] - range[0] + 1);
    //     }
    //     return result;
    // }

    // adjustForInserted(index: number, count: number): boolean {
    //     return false;
    // }

    // adjustForDeleted(index: number, count: number): boolean {
    //     return false;
    // }

    // adjustForMoved(oldIndex: number, newIndex: number, count: number): boolean {
    //     return false;
    // }
}

// export namespace SelectionRangeList {
//     /**
//      * A "range" is defined as an Array(2) where:
//      * element [0] is the beginning of the range
//      * element [1] is the end of the range (inclusive) and is always >= element [0]
//      */
//     export type InclusiveRange = [start: number, stop: number];
//     export interface Range extends InclusiveRange {
//         offsetY?: number;
//     }
// }
