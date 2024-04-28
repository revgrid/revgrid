import { RevContiguousIndexRange } from './contiguous-index-range';

export class RevContiguousIndexRangeList {
    // Ranges do not overlap, do not abut, and are ordered by start
    readonly ranges = new Array<RevContiguousIndexRange>(0);

    assign(other: RevContiguousIndexRangeList) {
        this.clear();
        const otherRanges = other.ranges;
        const count = otherRanges.length;
        const ranges = this.ranges;
        ranges.length = count;
        for (let i = 0; i < count; i++) {
            ranges[i] = otherRanges[i].createCopy();
        }
    }

    clear() {
        this.ranges.length = 0;
    }

    isEmpty() {
        return this.ranges.length === 0;
    }

    hasIndices() {
        return this.ranges.length > 0;
    }

    hasMoreThanOneIndex() {
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

    add(exclusiveStart: number, length: number) {
        let start: number;
        let after: number;
        if (length >= 0) {
            start = exclusiveStart;
            after = start + length;
        } else {
            after = exclusiveStart;
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

    delete(start: number, length: number) {
        let after: number;
        if (length >= 0) {
            after = start + length;
        } else {
            after = start;
            start += length;
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

    includesIndex(index: number) {
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

    findRangeWithIndex(index: number) {
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

    getIndexCount() {
        let result = 0;
        const ranges = this.ranges;
        for (const range of ranges) {
            result += range.length;
        }
        return result;
    }

    getIndices() {
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

    calculateOverlapRange(start: number, length: number) {
        if (length >= 0) {
            return this.calculateFirstOverlapRange(start, length);
        } else {
            return this.calculateLastOverlapRange(start, -length);
        }
    }

    calculateFirstOverlapRange(start: number, length: number) {
        if (length < 0) {
            start += length;
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

    calculateLastOverlapRange(start: number, length: number) {
        let after: number;
        if (length >= 0) {
            after = start + length;
        } else {
            after = start;
            start += length;
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

    adjustForMoved(oldIndex: number, newIndex: number, count: number): boolean {
        let changed = this.adjustForDeleted(oldIndex, count);
        if (this.adjustForInserted(newIndex, count)) {
            changed = true;
        }
        return changed;
    }
}
