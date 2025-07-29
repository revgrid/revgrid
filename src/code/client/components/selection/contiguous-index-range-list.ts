import { RevContiguousIndexRange } from './contiguous-index-range';

/**
 * Manages a list of non-overlapping, non-abutting, and ordered contiguous index ranges.
 *
 * This class provides methods to add, delete, and query ranges of indices, as well as to adjust
 * the ranges in response to insertions, deletions, and moves of indices. Ranges are represented
 * by `RevContiguousIndexRange` objects and are always kept in order by their starting index.
 *
 * Key features:
 * - Ranges do not overlap or abut, and are always ordered by their start index.
 * - Supports adding and deleting ranges, with automatic merging and splitting as needed.
 * - Provides methods to check for inclusion, count indices, and enumerate all indices.
 * - Can adjust ranges for inserted, deleted, or moved indices, maintaining consistency.
 *
 * Used to manage row and column selections.
 */
export class RevContiguousIndexRangeList {
    // Ranges do not overlap, do not abut, and are ordered by start
    readonly ranges = new Array<RevContiguousIndexRange>(0);

    assign(other: RevContiguousIndexRangeList): void {
        this.clear();
        const otherRanges = other.ranges;
        const count = otherRanges.length;
        const ranges = this.ranges;
        ranges.length = count;
        for (let i = 0; i < count; i++) {
            ranges[i] = otherRanges[i].createCopy();
        }
    }

    /**
     * Removes all index ranges from the list, effectively clearing the selection.
     */
    clear(): void {
        this.ranges.length = 0;
    }

    /**
     * Determines whether the list of contiguous index ranges is empty.
     * @returns `true` if there are no ranges in the list; otherwise, `false`.
     */
    isEmpty(): boolean {
        return this.ranges.length === 0;
    }

    /**
     * Determines whether there are any index ranges present in the list.
     *
     * @returns `true` if the list contains at least one range; otherwise, `false`.
     */
    hasIndices(): boolean {
        return this.ranges.length > 0;
    }

    /**
     * Determines whether the list of contiguous index ranges contains more than one index in total.
     * Returns `true` if there is at least one range with a length greater than one,
     * or if there are multiple single-index ranges.
     *
     * @returns `true` if there is more than one index represented in the ranges; otherwise, `false`.
     */
    hasMoreThanOneIndex(): boolean {
        const ranges = this.ranges;
        let gotOne = false;
        for (const range of ranges) {
            if (range.length === 1) {
                if (gotOne) {
                    return true;
                } else {
                    gotOne = true;
                }
            } else {
                return true;
            }
        }
        return false;
    }

    /**
     * Adds a contiguous range of indices to the list, merging with existing ranges if necessary.
     *
     * The range is specified by an start or excluded end index, and a length. If the length is negative,
     * the range is added in reverse order (excluding the start index). The method ensures that overlapping or adjacent ranges
     * are merged into a single range, and prevents adding a range that is already fully contained
     * within an existing range.
     *
     * @param startOrExEnd - The starting index of the range to add if `length` is positive, or the exclusive end index if `length` is negative.
     * @param length - The length of the range. If negative, the range is specified from its exclusive end.
     * @returns `true` if the range was added or merged; `false` if the range was already contained and no change was made.
     */
    add(startOrExEnd: number, length: number): boolean {
        let start: number;
        let after: number;
        if (length >= 0) {
            start = startOrExEnd;
            after = start + length;
        } else {
            after = startOrExEnd;
            start = after + length; // length is negative
            length = -length;
        }
        const ranges = this.ranges;
        const oldCount = ranges.length;

        let firstAffectedExistingRangeIndex: number | undefined;
        let lastAffectedExistingRangeIndex: number | undefined;
        for (let i = 0; i < oldCount; i++) {
            const range = ranges[i];
            const rangeAfter = range.after;
            if (rangeAfter >= start) {
                // end of existing range either abuts start of added range or is within it or after it
                if (firstAffectedExistingRangeIndex === undefined) {
                    // found first affected range
                    firstAffectedExistingRangeIndex = i;
                }

                if (rangeAfter >= after) {
                    // last existing range affected by added range
                    const rangeStart = range.start;
                    if (rangeStart <= start) {
                        // existing range contains added range
                        return false; // no change
                    } else {
                        if (rangeStart <= after) {
                            // existing range either overlaps or abuts end of added range
                            lastAffectedExistingRangeIndex = i;
                            break;

                        } else {
                            // existing range is after added range (with no overlap)
                            const newRange = new RevContiguousIndexRange(start, length);
                            ranges.splice(i, 0, newRange); // insert added range before this existing one
                        }
                        return true;
                    }
                }
            }
        }

        if (firstAffectedExistingRangeIndex === undefined) {
            // No existing range affected.  Must be beyond all of them.  Add at end
            const range = new RevContiguousIndexRange(start, length);
            ranges.push(range);
        } else {
            // Overlap between added range and existing ranges.
            const firstAffectedExistingRange = ranges[firstAffectedExistingRangeIndex];
            if (firstAffectedExistingRange.start > start) {
                firstAffectedExistingRange.setStart(start); // extend start of existing range back to cover added range
            }

            if (lastAffectedExistingRangeIndex === undefined) {
                // all existing ranges after first affected, are within added range.
                ranges.splice(firstAffectedExistingRangeIndex + 1); // remove all subsequent existing ranges
            } else {
                // Ranges between firstAffectedExistingRangeIndex and lastAffectedExistingRangeIndex are affected.
                if (lastAffectedExistingRangeIndex > firstAffectedExistingRangeIndex) {
                    // merge affected existing ranges after first into first
                    const lastAffectedExistingRange = ranges[lastAffectedExistingRangeIndex];
                    firstAffectedExistingRange.setAfter(lastAffectedExistingRange.after);
                    // then delete affected existing affected ranges after first
                    const deleteCount = lastAffectedExistingRangeIndex - firstAffectedExistingRangeIndex;
                    ranges.splice(firstAffectedExistingRangeIndex + 1, deleteCount);
                }
            }

            if (firstAffectedExistingRange.after < after) {
                firstAffectedExistingRange.setAfter(after); // extend end of first affected range to cover added range
            }

            // let lastAffectedExistingRangeIndex: number | undefined;
            // for (let i = firstAffectedExistingRangeIndex + 1; i < oldCount; i++) {
            //     const range = ranges[i];
            //     const rangeAfter = range.after;

            //     if (rangeAfter >= after) {
            //         lastAffectedExistingRangeIndex = i;
            //         break;
            //     }
            // }

            // if (lastAffectedExistingRangeIndex === undefined) {
            //     // added range extends beyond all existing ranges
            //     firstAffectedExistingRange.setAfter(after);
            //     ranges.splice(firstAffectedExistingRangeIndex + 1);
            //     return true;
            // } else {
            //     // extend first affected range to cover all subsequent affected ranges and then delete all subsequent affected ranges
            //     const lastAffectedExistingRange = ranges[lastAffectedExistingRangeIndex];
            //     firstAffectedExistingRange.setAfter(lastAffectedExistingRange.after);
            //     ranges.splice(firstAffectedExistingRangeIndex + 1, lastAffectedExistingRangeIndex - firstAffectedExistingRangeIndex);
            //     return true;
            // }
        }
        return true;
    }

    /**
     * Deletes a contiguous range of indices from the selection.
     *
     * The method updates the internal ranges to reflect the deletion, splitting or resizing ranges as necessary.
     *
     * @param startOrExEnd - The starting index of the range to delete if `length` is positive, or the exclusive end index if `length` is negative.
     * @param length - The length of the range. If negative, the range is specified from its exclusive end.
     * @returns `true` if any ranges were deleted or modified; `false` if the deletion did not affect any ranges.
     */
    delete(startOrExEnd: number, length: number): boolean {
        let after: number;
        let start: number;
        if (length >= 0) {
            start = startOrExEnd;
            after = start + length;
        } else {
            after = startOrExEnd;
            start = after + length; // length is negative
            length = - length;
        }
        const ranges = this.ranges;
        const oldCount = this.ranges.length;

        let firstAffectedExistingRangeIndex: number | undefined;
        let firstAffectedExistingRangeKept = false;

        for (let i = 0; i < oldCount; i++) {
            const range = ranges[i];
            const rangeAfter = range.after;
            if (rangeAfter >= start) {
                // found first affected range
                const rangeIndex = range.start;
                if (rangeIndex >= after) {
                    // deletion does not contain any ranges - nothing to do
                    return false;
                } else {
                    // see if part of range exists before deletion
                    if (rangeIndex < start) {
                        // range changed to represent range before deletion
                        range.setAfter(start);
                        firstAffectedExistingRangeKept = true;
                    }

                    if (rangeAfter >= after) {
                        // only range affected
                        // see if part of range exists after deletion
                        if (rangeAfter > after) {
                            if (firstAffectedExistingRangeKept) {
                                // range was split.  Add after part of split
                                const afterRange = new RevContiguousIndexRange(after, rangeAfter - after);
                                ranges.splice(i + 1, 0, afterRange);
                            } else {
                                // range changed to represent range after deletion
                                range.setStart(after);
                                firstAffectedExistingRangeKept = true;
                            }
                        }
                        if (!firstAffectedExistingRangeKept) {
                            // range exists completely within deletion. Delete it
                            ranges.splice(i, 1);
                        }
                        return true;
                    } else {
                        firstAffectedExistingRangeIndex = i;
                        break;
                    }
                }
            }
        }

        if (firstAffectedExistingRangeIndex === undefined) {
            // No overlap with existing ranges - nothing to do
            return false;
        } else {

            let lastDeleteRangeIndex = ranges.length - 1; // assume all subsequent ranges deleted
            for (let i = firstAffectedExistingRangeIndex + 1; i < oldCount; i++) {
                const range = ranges[i];
                const rangeAfter = range.after;

                if (rangeAfter >= after) {
                    // found last affected range
                    if (rangeAfter === after) {
                        // all of last range is affected. Delete up to it
                        lastDeleteRangeIndex = i;
                    } else {
                        // part of end of last range not deleted - resize it
                        const lastAffectedExistingRange = ranges[i];
                        lastAffectedExistingRange.setStart(after);
                        lastDeleteRangeIndex = i - 1;
                    }
                    break;
                }
            }

            // delete ranges affected by deletion and not kept
            const firstDeleteRangeIndex = firstAffectedExistingRangeKept ? firstAffectedExistingRangeIndex + 1 : firstAffectedExistingRangeIndex;
            ranges.splice(firstDeleteRangeIndex, lastDeleteRangeIndex - firstDeleteRangeIndex + 1);

            return true;
        }
    }

    /**
     * Determines whether the specified index is included within any of the contiguous index ranges.
     *
     * @param index - The index to check for inclusion.
     * @returns `true` if the index is included in any range; otherwise, `false`.
     */
    includesIndex(index: number): boolean {
        const ranges = this.ranges;
        const rangeCount = this.ranges.length;
        for (let i = 0; i < rangeCount; i++) {
            const range = ranges[i];
            if (range.includes(index)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Searches for and returns the first contiguous index range that includes the specified index.
     *
     * @param index - The index to search for within the list of contiguous index ranges.
     * @returns The {@link RevContiguousIndexRange} that contains the given index, or `undefined` if no such range exists.
     */
    findRangeWithIndex(index: number): RevContiguousIndexRange | undefined {
        const ranges = this.ranges;
        const rangeCount = this.ranges.length;
        for (let i = 0; i < rangeCount; i++) {
            const range = ranges[i];
            if (range.includes(index)) {
                return range;
            }
        }
        return undefined;
    }

    /**
     * Calculates and returns the total number of indices across all contiguous index ranges.
     *
     * Iterates through each range in the `ranges` array and sums their lengths to determine
     * the total count of selected indices.
     *
     * @returns The total count of indices in all ranges.
     */
    getIndexCount(): number {
        let result = 0;
        const ranges = this.ranges;
        for (const range of ranges) {
            result += range.length;
        }
        return result;
    }

    /**
     * Returns an array containing all indices represented by the current list of contiguous index ranges.
     * The indices are collected from each range in order and combined into a single array.
     *
     * @returns An array of indices covered by all ranges in this list.
     */
    getIndices(): number[] {
        const indexCount = this.getIndexCount();
        const result = new Array<number>(indexCount);
        const ranges = this.ranges;
        const rangeCount = this.ranges.length;
        let count = 0;
        for (let i = 0; i < rangeCount; i++) {
            const range = ranges[i];
            count = range.addIndicesToArray(result, count);
        }
        return result;
    }

    /**
     * Calculates and returns the first or last overlapping range between the given range and the existing ranges.
     * If the length is non-negative, it calculates the first overlapping range.
     * If the length is negative, it calculates the last overlapping range.
     *
     * @param startOrExEnd - The starting index or exclusive ending index of the range to check for overlap.
     * @param length - The length of the range. If negative, the range is specified from its exclusive end.
     * @returns The overlapping contiguous index range, or `undefined` if there is no overlap.
     */
    calculateOverlapRange(startOrExEnd: number, length: number): RevContiguousIndexRange | undefined {
        if (length >= 0) {
            return this.calculateFirstOverlapRange(startOrExEnd, length);
        } else {
            return this.calculateLastOverlapRange(startOrExEnd, -length);
        }
    }

    /**
     * Calculates and returns the first overlapping range between the given range and the existing ranges.
     *
     * Given a starting index (or exclusive end index) and a length, this method searches the list of
     * contiguous index ranges in order and returns the first range that overlaps with the specified range.
     *
     * @param startOrExEnd - The starting index of the range, or the exclusive end index if `length` is negative.
     * @param length - The length of the range. If negative, the range is specified from its exclusive end.
     * @returns A new `RevContiguousIndexRange` representing the first overlapping range, or `undefined` if there is no overlap.
     */
    calculateFirstOverlapRange(startOrExEnd: number, length: number): RevContiguousIndexRange | undefined {
        let start: number;
        if (length >= 0) {
            start = startOrExEnd;
        } else {
            start = startOrExEnd + length; // length is negative
            length = -length;
        }

        const ranges = this.ranges;
        for (const range of ranges) {
            const rangeAfter = range.after;
            if (rangeAfter >= start) {
                const after = start + length;
                const rangeStart = range.start;
                if (rangeAfter < after) {
                    if (rangeStart >= start) {
                        return new RevContiguousIndexRange(rangeStart, rangeAfter - rangeStart);
                    } else {
                        return new RevContiguousIndexRange(start, rangeAfter - start);
                    }
                } else {
                    if (rangeStart < after) {
                        return new RevContiguousIndexRange(rangeStart, after - rangeStart);
                    } else {
                        return undefined;
                    }
                }
            }
        }
        return undefined;
    }

    /**
     * Calculates the last overlapping range between the specified range and the existing ranges.
     *
     * Given a starting index (or exclusive end index) and a length, this method searches the list of
     * contiguous index ranges in reverse order and returns the last range that overlaps with the specified range.
     *
     * @param startOrExEnd - The starting index of the range if `length` is positive, or the exclusive end index if `length` is negative.
     * @param length - The length of the range. If negative, the range is specified from its exclusive end.
     * @returns A new `RevContiguousIndexRange` representing the last overlapping range, or `undefined` if there is no overlap.
     */
    calculateLastOverlapRange(startOrExEnd: number, length: number): RevContiguousIndexRange | undefined {
        let start: number;
        let after: number;
        if (length >= 0) {
            start = startOrExEnd;
            after = start + length;
        } else {
            after = startOrExEnd;
            start = after + length; // length is negative
            length = -length;
        }
        const ranges = this.ranges;
        const rangeCount = ranges.length;
        for (let i = rangeCount - 1; i >= 0; i--) {
            const range = ranges[i];
            const rangeStart = range.start;
            if (rangeStart < after) {
                const rangeAfter = range.after;
                if (rangeStart >= start) {
                    if (rangeAfter < after) {
                        return new RevContiguousIndexRange(rangeStart, rangeAfter - rangeStart);
                    } else {
                        return new RevContiguousIndexRange(rangeStart, after - rangeStart);
                    }
                } else {
                    if (rangeAfter > start) {
                        return new RevContiguousIndexRange(start, rangeAfter - start);
                    } else {
                        return undefined;
                    }
                }
            }
        }
        return undefined;
    }

    /**
     * Adjusts the index ranges in the list to account for the insertion of new items.
     *
     * This method updates all ranges that are at or above the insertion point by moving them up by the specified count.
     * If the insertion point falls within an existing range, that range is grown to include the new items.
     *
     * @param start - The index at which new items are inserted.
     * @param count - The number of items inserted.
     * @returns `true` if any ranges were changed; otherwise, `false`.
     */
    adjustForInserted(start: number, count: number): boolean {
        const ranges = this.ranges;
        const rangeCount = ranges.length;
        let changed = false;
        for (let i = rangeCount - 1; i >= 0; i--) {
            const range = ranges[i];
            const rangeStart = range.start;
            if (rangeStart >= start) {
                // Above insertion point - move whole range
                range.move(count);
                changed = true;
            } else {
                // Insertion point inside range - grow range
                if (range.after > start) {
                    range.grow(count);
                    changed = true;
                }
                break; // all subsequent will be completely below insertion so can ignore
            }
        }

        return changed;
    }

    /**
     * Adjusts the list of contiguous index ranges to account for a deletion of items.
     *
     * This method updates the internal ranges to reflect the removal of a contiguous block of items,
     * starting at the specified `start` index and spanning `count` items. It shifts, shrinks, or removes
     * ranges as necessary to maintain consistency after the deletion. If any ranges are fully enclosed
     * within the deleted region, they are removed. Ranges that overlap the deleted region are shrunk,
     * and ranges above the deleted region are shifted down. If possible, adjacent ranges are merged after
     * the adjustment.
     *
     * @param start - The starting index of the deleted region.
     * @param count - The number of contiguous items deleted.
     * @returns `true` if any ranges were changed as a result of the deletion; otherwise, `false`.
     */
    adjustForDeleted(start: number, count: number): boolean {
        const ranges = this.ranges;
        const rangeCount = ranges.length;
        let changed = false;

        if (rangeCount > 0) {
            const after = start + count;
            let beforeDeletionFirstStartingRangeIndex: number | undefined
            let lastRangeFullyEnclosedinDeletionIndex: number | undefined;
            let afterDeletionFirstEndingRange: RevContiguousIndexRange | undefined;
            for (let i = rangeCount - 1; i >= 0; i--) {
                const range = ranges[i];
                const rangeStart = range.start;
                if (rangeStart >= after) {
                    // Above deletion - move whole range down
                    range.move(-count);
                    afterDeletionFirstEndingRange = range;
                    changed = true;
                } else {
                    const rangeAfter = range.after;
                    if (rangeStart >= start) {
                        // first part or whole range in deletion
                        if (rangeAfter > after) {
                            // first part of range is in deletion
                            const overlapLength = after - rangeStart;
                            range.grow(-overlapLength);
                            range.move(count - overlapLength);
                            afterDeletionFirstEndingRange = range;
                            changed = true;
                        } else {
                            // range full contained in deletion
                            if (lastRangeFullyEnclosedinDeletionIndex === undefined) {
                                lastRangeFullyEnclosedinDeletionIndex = i;
                            }
                        }
                    } else {
                        // first range that starts before deletion
                        if (rangeAfter >= after) {
                            // range completely contains deletion
                            range.grow(-count);
                            changed = true;
                        } else {
                            if (rangeAfter > start) {
                                // range overlaps start of deletion
                                const overlapLength = rangeAfter - start;
                                range.grow(-overlapLength);
                                changed = true;
                            }
                        }
                        beforeDeletionFirstStartingRangeIndex = i;
                        // no more ranges will be affected
                        break;
                    }
                }
            }

            if (lastRangeFullyEnclosedinDeletionIndex !== undefined) {
                // We have at least one range which is fully enclosed in deletion. These ranges need to be deleted
                const firstDeleteIndex = beforeDeletionFirstStartingRangeIndex === undefined ? 0 : beforeDeletionFirstStartingRangeIndex + 1;
                const rangeDeleteCount = lastRangeFullyEnclosedinDeletionIndex - firstDeleteIndex + 1;
                ranges.splice(firstDeleteIndex, rangeDeleteCount);
                changed = true;
            }

            if (beforeDeletionFirstStartingRangeIndex !== undefined && afterDeletionFirstEndingRange !== undefined) {
                // Check if ranges either side of deletion can be merged
                const firstRange = ranges[beforeDeletionFirstStartingRangeIndex];
                if (firstRange.after === afterDeletionFirstEndingRange.start) {
                    afterDeletionFirstEndingRange.setStart(firstRange.start);
                    ranges.splice(beforeDeletionFirstStartingRangeIndex, 1);
                }
            }
        }

        return changed;
    }

    /**
     * Adjusts the current index ranges to account for a contiguous block of items being moved
     * from one position to another within a collection.
     *
     * This method first removes the specified range from its old position, then inserts it at the new position.
     * It returns whether any changes were made to the selection as a result of the move.
     *
     * @param oldIndex - The starting index of the block being moved.
     * @param newIndex - The index at which the block should be inserted.
     * @param count - The number of contiguous items being moved.
     * @returns `true` if the selection was changed as a result of the move; otherwise, `false`.
     */
    adjustForMoved(oldIndex: number, newIndex: number, count: number): boolean {
        let changed = this.adjustForDeleted(oldIndex, count);
        if (this.adjustForInserted(newIndex, count)) {
            changed = true;
        }
        return changed;
    }
}
