import { RevAssertError, RevSchemaField } from '../../../common';
import { RevSubgrid } from '../../interfaces';
import { RevBehavioredColumnSettings } from '../../settings';
import { RevSelectionRectangle } from './selection-rectangle';
import { RevSelectionSubgridRectangleList } from './selection-subgrid-rectangle-list';

export class RevSelectionRectangleList<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    private readonly _subgridLists = new Array<RevSelectionSubgridRectangleList<BCS, SF>>(0);
    private _lastRectangle: RevSelectionRectangle<BCS, SF> | undefined;

    get areaCount() {
        const subgridLists = this._subgridLists;
        const subgridCount = subgridLists.length;
        let count = 0;
        for (let i = 0; i < subgridCount; i++) {
            count += subgridLists[i].areaCount;
        }
        return count;
    }

    has(inSubgrid: RevSubgrid<BCS, SF> | undefined) {
        if (inSubgrid === undefined) {
            const subgridLists = this._subgridLists;
            const count = subgridLists.length;
            for (let i = 0; i < count; i++) {
                if (subgridLists[i].has) {
                    return true;
                }
            }
            return false;
        } else {
            const subgridList = this.getSubgridList(inSubgrid);
            return subgridList.has;
        }
    }
    assign(other: RevSelectionRectangleList<BCS, SF>): void {
        const subgridLists = this._subgridLists;
        const otherSubgridLists = other._subgridLists;
        const otherCount = otherSubgridLists.length;

        subgridLists.length = otherCount;
        for (let i = 0; i < otherCount; i++) {
            const otherSubgridList = otherSubgridLists[i];
            const subgridList = new RevSelectionSubgridRectangleList<BCS, SF>(otherSubgridList.subgrid);
            subgridList.assign(otherSubgridList);
            subgridLists[i] = subgridList;
        }

        this._lastRectangle = other._lastRectangle;
    }

    isEmpty(): boolean {
        const subgridLists = this._subgridLists;
        const count = subgridLists.length;
        for (let i = 0; i < count; i++) {
            if (!subgridLists[i].isEmpty()) {
                return false;
            }
        }
        return true;
    }

    hasPoints(): boolean {
        const subgridLists = this._subgridLists;
        const count = subgridLists.length;
        for (let i = 0; i < count; i++) {
            if (subgridLists[i].hasPoints()) {
                return true;
            }
        }
        return false;
    }

    hasMoreThanOnePoint(): boolean {
        const subgridLists = this._subgridLists;
        const subgridListCount = subgridLists.length;
        let gotOne = false;
        for (let i = 0; i < subgridListCount; i++) {
            const subgridList = subgridLists[i];
            const hasZeroOneOrMoreThanOneIndex = subgridList.hasZeroOneOrMoreThanOnePoint();
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
                    throw new RevAssertError('SRLHMTOI84522');
            }
        }
        return false;
    }

    hasPointOtherThan(subgrid: RevSubgrid<BCS, SF> | undefined, activeColumnIndex: number, subgridRowIndex: number): boolean {
        if (subgrid === undefined) {
            const subgridLists = this._subgridLists;
            const count = subgridLists.length;
            for (let i = 0; i < count; i++) {
                if (subgridLists[i].hasPointOtherThan(activeColumnIndex, subgridRowIndex)) {
                    return true;
                }
            }
            return false;
        } else {
            const subgridList = this.getSubgridList(subgrid);
            return subgridList.hasPointOtherThan(activeColumnIndex, subgridRowIndex);
        }
    }

    clear(): void {
        const subgridLists = this._subgridLists;
        const count = subgridLists.length;
        for (let i = 0; i < count; i++) {
            subgridLists[i].clear();
        }
        this._lastRectangle = undefined;
    }

    getRectangles(subgrid: RevSubgrid<BCS, SF> | undefined): readonly RevSelectionRectangle<BCS, SF>[] {
        if (subgrid === undefined) {
            const rectangles = new Array<RevSelectionRectangle<BCS, SF>>(0);
            const subgridLists = this._subgridLists;
            const subgridCount = subgridLists.length;
            for (let i = 0; i < subgridCount; i++) {
                rectangles.push(...subgridLists[i].rectangles);
            }
            return rectangles;
        } else {
            const subgridList = this.getSubgridList(subgrid);
            return subgridList.rectangles;
        }
    }

    getLastRectangle(): RevSelectionRectangle<BCS, SF> | undefined {
        return this._lastRectangle;
    }

    getRectanglesContainingPoint(subgrid: RevSubgrid<BCS, SF>, activeColumnIndex: number, subgridRowIndex: number): RevSelectionRectangle<BCS, SF>[] {
        const rectangles = this.getRectangles(subgrid);
        const result = new Array<RevSelectionRectangle<BCS, SF>>();
        for (const rectangle of rectangles) {
            if (rectangle.containsXY(activeColumnIndex, subgridRowIndex)) {
                result.push(rectangle);
            }
        }
        return result;
    }
    push(rectangle: RevSelectionRectangle<BCS, SF>): void {
        const subgridList = this.getSubgridList(rectangle.subgrid);
        subgridList.push(rectangle);
        this._lastRectangle = rectangle;
    }

    only(rectangle: RevSelectionRectangle<BCS, SF>): void {
        this.clear();
        this.push(rectangle);
    }

    findIndex(subgrid: RevSubgrid<BCS, SF>, ox: number, oy: number, ex: number, ey: number): number {
        const subgridList = this.getSubgridList(subgrid);
        return subgridList.findIndex(ox, oy, ex, ey);
    }

    removeAt(subgrid: RevSubgrid<BCS, SF>, index: number): void {
        const subgridList = this.getSubgridList(subgrid);
        const removedRectangle = subgridList.removeAt(index);
        if (this._lastRectangle === removedRectangle) {
            this._lastRectangle = undefined;
        }
    }

    removeLast(): boolean {
        const lastRectangle = this._lastRectangle;
        if (lastRectangle === undefined) {
            return false;
        } else {
            const subgridList = this.getSubgridList(lastRectangle.subgrid);
            const removed = subgridList.remove(lastRectangle);
            if (!removed) {
                throw new RevAssertError('SRLRL49891');
            } else {
                this._lastRectangle = undefined;
                return removed;
            }
        }
    }

    containsPoint(subgrid: RevSubgrid<BCS, SF>, x: number, y: number): boolean {
        const subgridList = this.getSubgridList(subgrid);
        return subgridList.containsPoint(x, y);
    }

    adjustForYRangeInserted(subgrid: RevSubgrid<BCS, SF>, index: number, count: number): boolean {
        const subgridList = this.getSubgridList(subgrid);
        return subgridList.adjustForYRangeInserted(index, count);
    }

    adjustForYRangeDeleted(subgrid: RevSubgrid<BCS, SF>, index: number, count: number): boolean {
        const subgridList = this.getSubgridList(subgrid);
        return subgridList.adjustForYRangeDeleted(index, count);
    }

    adjustForYRangeMoved(subgrid: RevSubgrid<BCS, SF>, oldIndex: number, newIndex: number, count: number): boolean {
        const subgridList = this.getSubgridList(subgrid);
        return subgridList.adjustForYRangeMoved(oldIndex, newIndex, count);
    }

    adjustForXRangeInserted(index: number, count: number): boolean {
        const subgridLists = this._subgridLists;
        const subgridCount = subgridLists.length;
        let changed = false;
        for (let i = 0; i < subgridCount; i++) {
            if (subgridLists[i].adjustForXRangeInserted(index, count)) {
                changed = true;
            }
        }
        return changed;
    }

    adjustForXRangeDeleted(index: number, count: number): boolean {
        const subgridLists = this._subgridLists;
        const subgridCount = subgridLists.length;
        let changed = false;
        for (let i = 0; i < subgridCount; i++) {
            if (subgridLists[i].adjustForXRangeDeleted(index, count)) {
                changed = true;
            }
        }
        return changed;
    }

    private getSubgridList(subgrid: RevSubgrid<BCS, SF>): RevSelectionSubgridRectangleList<BCS, SF> {
        const subgridLists = this._subgridLists;
        const count = subgridLists.length;
        for (let i = 0; i < count; i++) {
            const subgridList = subgridLists[i];
            if (subgridList.subgrid === subgrid) {
                return subgridList;
            }
        }

        const subgridList = new RevSelectionSubgridRectangleList<BCS, SF>(subgrid);
        subgridLists.push(subgridList);

        return subgridList;
    }
}
