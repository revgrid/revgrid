import { ContiguousIndexRange } from './contiguous-index-range';

export class ContiguousIndexRangeList {
    readonly ranges = new Array<ContiguousIndexRange>(0);

    assign(other: ContiguousIndexRangeList) {
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

    add(start: number, length: number) {
        const after = start + length;
        const ranges = this.ranges;
        const oldCount = ranges.length;

        let firstAffectedExistingRangeIndex: number | undefined;
        for (let i = 0; i < oldCount; i++) {
            const range = ranges[i];
            const rangeAfter = range.after;
            if (rangeAfter >= start) {
                // found first affected range
                if (rangeAfter >= after) {
                    // nothing else to do as only this range affected
                    if (range.start <= start) {
                        return false; // existing range contained added range so no change
                    } else {
                        range.setStart(start); // adjust this range to contain added range
                        return true;
                    }
                } else {
                    range.setStart(start); // start of new range (either this or combination)
                    firstAffectedExistingRangeIndex = i;
                    break;
                }
            }
        }

        if (firstAffectedExistingRangeIndex === undefined) {
            // No overlap with existing ranges - just add at end
            const range = new ContiguousIndexRange(start, length);
            ranges.push(range);
            return true;
        } else {
            const firstAffectedExistingRange = ranges[firstAffectedExistingRangeIndex];

            let lastAffectedExistingRangeIndex: number | undefined;
            for (let i = firstAffectedExistingRangeIndex + 1; i < oldCount; i++) {
                const range = ranges[i];
                const rangeAfter = range.after;

                if (rangeAfter >= after) {
                    lastAffectedExistingRangeIndex = i;
                    break;
                }
            }

            if (lastAffectedExistingRangeIndex === undefined) {
                // added range extends beyond all existing ranges
                firstAffectedExistingRange.setAfter(after);
                ranges.splice(firstAffectedExistingRangeIndex + 1);
                return true;
            } else {
                // extend first affected range to cover all subsequent affected ranges and then delete all subsequent affected ranges
                const lastAffectedExistingRange = ranges[lastAffectedExistingRangeIndex];
                firstAffectedExistingRange.setAfter(lastAffectedExistingRange.after);
                ranges.splice(firstAffectedExistingRangeIndex + 1, lastAffectedExistingRangeIndex - firstAffectedExistingRangeIndex);
                return true;
            }
        }
    }

    delete(start: number, length: number) {
        const after = start + length;
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
                                const afterRange = new ContiguousIndexRange(after, rangeAfter - after);
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
            let firstRangeStartingBeforeDeletionIndex: number | undefined
            let lastRangeFullyEnclosedinDeletionIndex: number | undefined;
            let upperPossibleMergeableRange: ContiguousIndexRange | undefined;
            for (let i = rangeCount - 1; i >= 0; i--) {
                const range = ranges[i];
                const rangeStart = range.start;
                if (rangeStart >= after) {
                    // Above deletion - move whole range down
                    range.move(-count);
                    upperPossibleMergeableRange = range;
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
                            upperPossibleMergeableRange = range;
                            changed = true;
                        } else {
                            // range full contained in deletion
                            if (lastRangeFullyEnclosedinDeletionIndex !== undefined) {
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
                        firstRangeStartingBeforeDeletionIndex = i;
                        // no more ranges will be affected
                        break;
                    }
                }
            }

            if (lastRangeFullyEnclosedinDeletionIndex !== undefined) {
                const firstDeleteIndex = firstRangeStartingBeforeDeletionIndex === undefined ? 0 : firstRangeStartingBeforeDeletionIndex + 1;
                const rangeDeleteCount = lastRangeFullyEnclosedinDeletionIndex - firstDeleteIndex + 1;
                ranges.splice(firstDeleteIndex, rangeDeleteCount);
                changed = true;
            }

            if (firstRangeStartingBeforeDeletionIndex !== undefined && upperPossibleMergeableRange !== undefined) {
                const firstRange = ranges[firstRangeStartingBeforeDeletionIndex];
                if (firstRange.after === upperPossibleMergeableRange.start) {
                    upperPossibleMergeableRange.setStart(firstRange.start);
                    ranges.splice(firstRangeStartingBeforeDeletionIndex, 1);
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
