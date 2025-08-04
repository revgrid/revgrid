import { RevAssertError, RevSchemaField } from '../../../common';
import { RevSubgrid } from '../../interfaces';
import { RevBehavioredColumnSettings } from '../../settings';
import { RevContiguousIndexRange } from './contiguous-index-range';
import { RevSubgridSelectionRangeList } from './subgrid-selection-range-list';

/** public */
export class RevSelectionRows<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    private readonly _subgridLists = new Array<RevSubgridSelectionRangeList<BCS, SF>>(0);

    /** Can use this to include subgrids in _subgridList in a particular order.  The most used subgrids can be included first to improve performance.*/
    registerSubgrids(subgrids: RevSubgrid<BCS, SF>[]): void {
        const registerCount = subgrids.length;
        for (let i = 0; i < registerCount; i++) {
            const registerSubgrid = subgrids[i];
            this.getSubgridList(registerSubgrid); // will add if not present
        }
    }

    hasMoreThanOneIndex(): boolean {
        const subgridLists = this._subgridLists;
        const subgridListCount = subgridLists.length;
        let gotOne = false;
        for (let i = 0; i < subgridListCount; i++) {
            const subgridList = subgridLists[i];
            const hasZeroOneOrMoreThanOneIndex = subgridList.hasZeroOneOrMoreThanOneIndex();
            switch (hasZeroOneOrMoreThanOneIndex) {
                case 0: // no indices
                    continue;
                case 1: // one index
                    if (gotOne) {
                        return true; // already got one, so this is the second one
                    } else {
                        gotOne = true; // first index found
                        continue;
                    }
                case -1: // more than one index
                    return true; // more than one index found
                default:
                    throw new RevAssertError('SRHMTOI84521');
            }
        }
        return false;
    }

    getIndices(): RevSelectionRows.SubgridIndices<BCS, SF>[] {
        const subgridLists = this._subgridLists;
        const maxCount = subgridLists.length;
        const result = new Array<RevSelectionRows.SubgridIndices<BCS, SF>>(maxCount);
        let count = 0;
        for (let i = 0; i < maxCount; i++) {
            const subgridList = subgridLists[i];
            const indices = subgridList.getIndices();
            if (indices.length > 0) {
                result[count++] = { subgrid: subgridList.subgrid, indices };
            }
        }

        result.length = count; // trim to actual count
        return result;
    }

    clear(): void {
        const subgridLists = this._subgridLists;
        const count = subgridLists.length;
        for (let i = 0; i < count; i++) {
            const subgridList = subgridLists[i];
            subgridList.clear();
        }
    }

    isEmpty(): boolean {
        const subgridLists = this._subgridLists;
        const subgridListCount = subgridLists.length;
        for (let i = 0; i < subgridListCount; i++) {
            const subgridList = subgridLists[i];
            if (!subgridList.isEmpty()) {
                return false;
            }
        }
        return true;
    }

    calculateAreaCount(): number {
        const subgridLists = this._subgridLists;
        const subgridListCount = subgridLists.length;
        let count = 0;
        for (let i = 0; i < subgridListCount; i++) {
            const subgridList = subgridLists[i];
            count += subgridList.areaCount;
        }
        return count;
    }

    hasIndices(subgrid: RevSubgrid<BCS, SF> | undefined): boolean {
        if (subgrid === undefined) {
            const subgridLists = this._subgridLists;
            const count = subgridLists.length;
            for (let i = 0; i < count; i++) {
                const subgridList = subgridLists[i];
                if (subgridList.hasIndices()) {
                    return true;
                }
            }
            return false;
        } else {
            const subgridList = this.getSubgridList(subgrid);
            return subgridList.hasIndices();
        }
    }

    getIndexCount(subgrid: RevSubgrid<BCS, SF> | undefined): number {
        if (subgrid === undefined) {
            const subgridLists = this._subgridLists;
            const subgridListCount = subgridLists.length;
            let count = 0;
            for (let i = 0; i < subgridListCount; i++) {
                const subgridList = subgridLists[i];
                count += subgridList.getIndexCount();
            }
            return count;
        } else {
            const subgridList = this.getSubgridList(subgrid);
            return subgridList.getIndexCount();
        }
    }

    getSubgridIndexCount(subgrid: RevSubgrid<BCS, SF>): number {
        const subgridList = this.getSubgridList(subgrid);
        return subgridList.getIndexCount();
    }

    getSubgridIndices(subgrid: RevSubgrid<BCS, SF>): number[] {
        const subgridList = this.getSubgridList(subgrid);
        return subgridList.getIndices();
    }

    add(subgrid: RevSubgrid<BCS, SF>, subgridStartOrExEndRowIndex: number, count: number): boolean {
        const subgridList = this.getSubgridList(subgrid);
        return subgridList.add(subgridStartOrExEndRowIndex, count);
    }

    delete(subgrid: RevSubgrid<BCS, SF>, subgridStartOrExEndRowIndex: number, count: number): boolean {
        const subgridList = this.getSubgridList(subgrid);
        return subgridList.delete(subgridStartOrExEndRowIndex, count);
    }

    calculateOverlapRange(subgrid: RevSubgrid<BCS, SF>, subgridStartOrExEndRowIndex: number, count: number): RevContiguousIndexRange | undefined {
        const subgridList = this.getSubgridList(subgrid);
        return subgridList.calculateOverlapRange(subgridStartOrExEndRowIndex, count);
    }

    includesIndex(subgrid: RevSubgrid<BCS, SF>, subgridRowIndex: number): boolean {
        const subgridList = this.getSubgridList(subgrid);
        return subgridList.includesIndex(subgridRowIndex);
    }

    findRangeWithIndex(subgrid: RevSubgrid<BCS, SF>, subgridRowIndex: number): RevContiguousIndexRange | undefined {
        const subgridList = this.getSubgridList(subgrid);
        return subgridList.findRangeWithIndex(subgridRowIndex);
    }

    adjustForInserted(subgrid: RevSubgrid<BCS, SF>, start: number, count: number): boolean {
        const subgridList = this.getSubgridList(subgrid);
        return subgridList.adjustForInserted(start, count);
    }

    adjustForDeleted(subgrid: RevSubgrid<BCS, SF>, start: number, count: number): boolean {
        const subgridList = this.getSubgridList(subgrid);
        return subgridList.adjustForDeleted(start, count);
    }

    adjustForMoved(subgrid: RevSubgrid<BCS, SF>, oldIndex: number, newIndex: number, count: number): boolean {
        const subgridList = this.getSubgridList(subgrid);
        return subgridList.adjustForMoved(oldIndex, newIndex, count);
    }

    private getSubgridList(subgrid: RevSubgrid<BCS, SF>): RevSubgridSelectionRangeList<BCS, SF> {
        const subgridLists = this._subgridLists;
        const count = subgridLists.length;
        for (let i = 0; i < count; i++) {
            const subgridList = subgridLists[i];
            if (subgridList.subgrid === subgrid) {
                return subgridList;
            }
        }

        const subgridList = new RevSubgridSelectionRangeList<BCS, SF>(subgrid);
        subgridLists.push(subgridList);

        return subgridList;
    }
}

/** public */
export namespace RevSelectionRows {
    export interface SubgridIndices<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
        readonly subgrid: RevSubgrid<BCS, SF>;
        readonly indices: number[];
    }
}
