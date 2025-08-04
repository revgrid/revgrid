import { RevCornerRectangle, RevSchemaField, revCalculateNumberArrayUniqueCount } from '../../../common';
import { RevSubgrid } from '../../interfaces';
import { RevBehavioredColumnSettings } from '../../settings';
import { RevSelectionRectangle } from './selection-rectangle';

export class RevSelectionSubgridRectangleList<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    readonly rectangles: RevSelectionRectangle<BCS, SF>[] = [];
    private readonly _flattenedX = new Array<RevCornerRectangle>();
    private readonly _flattenedY = new Array<RevCornerRectangle>();

    get has() { return this.rectangles.length !== 0; }
    get areaCount() { return this.rectangles.length; }

    constructor(readonly subgrid: RevSubgrid<BCS, SF>) {
    }

    assign(other: RevSelectionSubgridRectangleList<BCS, SF>): void {
        const count = other.areaCount;

        const otherRectangles = other.rectangles;
        const rectangles = this.rectangles;
        rectangles.length = count;
        for (let i = 0; i < count; i++) {
            const otherRectangle = otherRectangles[i];
            rectangles[i] = otherRectangle.createCopy();
        }
    }

    isEmpty(): boolean { return this.rectangles.length === 0; }
    hasPoints(): boolean { return this.rectangles.length > 0; }

    hasMoreThanOnePoint(): boolean {
        const rectangles = this.rectangles;
        let gotOne = false;
        for (const rectangle of rectangles) {
            if (rectangle.width === 1 && rectangle.height === 1) {
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

    hasZeroOneOrMoreThanOnePoint(): 0 | 1 | -1  {
        const rectangles = this.rectangles;
        let gotOne = false;
        for (const rectangle of rectangles) {
            if (rectangle.width === 1 && rectangle.height === 1) {
                if (gotOne) {
                    return -1; // more than one index
                } else {
                    gotOne = true;
                }
            } else {
                return -1; // more than one index
            }
        }
        return gotOne ? 1 : 0; // 0 if no indices, 1 if one index
    }

    hasPointOtherThan(x: number, y: number): boolean {
        const rectangles = this.rectangles;
        for (const rectangle of rectangles) {
            if (rectangle.width > 1 || rectangle.height > 1) {
                return true;
            } else {
                const onlyPoint = rectangle.topLeft;
                if (onlyPoint.x !== x || onlyPoint.y !== y) {
                    return true;
                }
            }
        }
        return false;
    }

    clear(): void {
        this.rectangles.length = 0;
        this._flattenedX.length = 0;
        this._flattenedY.length = 0;
    }

    getLastRectangle(): RevSelectionRectangle<BCS, SF> | undefined {
        const rectangles = this.rectangles;
        if (rectangles.length > 0) {
            return rectangles[rectangles.length - 1];
        } else {
            return undefined;
        }
    }

    getRectanglesContainingPoint(x: number, y: number): RevSelectionRectangle<BCS, SF>[] {
        const rectangles = this.rectangles;
        const result = new Array<RevSelectionRectangle<BCS, SF>>(0);
        for (const rectangle of rectangles) {
            if (rectangle.containsXY(x, y)) {
                result.push(rectangle);
            }
        }
        return result;
    }
    push(rectangle: RevSelectionRectangle<BCS, SF>): void {
        this.rectangles.push(rectangle);
        this._flattenedX.push(rectangle.newXFlattened(0));
        this._flattenedY.push(rectangle.newYFlattened(0));
    }

    only(rectangle: RevSelectionRectangle<BCS, SF>): void {
        this.rectangles.length = 1;
        this.rectangles[0] = rectangle;
        this._flattenedX.length = 1;
        this._flattenedX[0] = rectangle.newXFlattened(0);
        this._flattenedY.length = 1;
        this._flattenedY[0] = rectangle.newYFlattened(0);
    }

    findIndex(ox: number, oy: number, ex: number, ey: number): number {
        return this.rectangles.findIndex((rectangle) => {
            return (
                rectangle.topLeft.x === ox && rectangle.topLeft.y === oy &&
                rectangle.extent.x === ex && rectangle.extent.y === ey
            );
        });
    }

    removeAt(index: number): RevSelectionRectangle<BCS, SF> | undefined {
        const rectangles = this.rectangles;
        if (index < 0 || index >= rectangles.length) {
            return undefined;
        } else {
            const rectangle = rectangles[index];
            this.rectangles.splice(index, 1);
            this._flattenedX.splice(index, 1);
            this._flattenedY.splice(index, 1);
            return rectangle;
        }
    }

    remove(rectangle: RevSelectionRectangle<BCS, SF>): boolean {
        const index = this.rectangles.indexOf(rectangle);
        if (index === -1) {
            return false;
        } else {
            this.rectangles.splice(index, 1);
            this._flattenedX.splice(index, 1);
            this._flattenedY.splice(index, 1);
            return true;
        }
    }

    containsY(y: number): boolean {
        return RevCornerRectangle.arrayContainsPoint(this._flattenedX, 0, y);
    }

    containsX(x: number): boolean {
        return RevCornerRectangle.arrayContainsPoint(this._flattenedY, x, 0);
    }

    containsPoint(x: number, y: number): boolean {
        return RevCornerRectangle.arrayContainsPoint(this.rectangles, x, y);
    }

    getUniqueXIndexCount(): number {
        const rectangles = this.rectangles;
        const rectangleCount = rectangles.length;
        if (rectangleCount === 0) {
            return 0;
        } else {
            if (rectangleCount === 1) {
                return rectangles[0].height;
            } else {
                const nonUniqueIndices = this.getNonUniqueXIndices();
                return revCalculateNumberArrayUniqueCount(nonUniqueIndices);
            }
        }
    }

    getNonUniqueXIndices(): number[] {
        const indices: number[] = [];
        const rectangles = this.rectangles;
        const rectangleCount = rectangles.length;
        for (let i = 0; i < rectangleCount; i++) {
            const rectangle = rectangles[i];
            const first = rectangle.y;
            const last = rectangle.exclusiveBottomRight.y;
            for (let index = first; index <= last; index++) {
                indices.push(index);
            }
        }
        return indices;
    }


    getFlattenedYs(): number[] {
        const result = Array<number>();
        const set: Record<number, boolean> = {};
        this.rectangles.forEach((rectangle) => {
            const top = rectangle.topLeft.y;
            const size = rectangle.height;
            for (let r = 0; r < size; r++) {
                const ti = r + top;
                if (!set[ti]) {
                    result.push(ti);
                    set[ti] = true;
                }
            }
        });

        result.sort((x, y) => {
            return x - y;
        });

        return result;
    }

    adjustForYRangeInserted(index: number, count: number): boolean {
        const rectangles = this.rectangles;
        const rectangleCount = rectangles.length;
        let changed = false;
        if (rectangleCount > 0) {
            for (let i = rectangleCount - 1; i >= 0; i--) {
                const rectangle = rectangles[i];
                if (rectangle.adjustForYRangeInserted(index, count)) {
                    changed = true;
                }
            }
        }
        return changed;
    }

    adjustForYRangeDeleted(index: number, count: number): boolean {
        const rectangles = this.rectangles;
        const rectangleCount = rectangles.length;
        let changed = false;
        if (rectangleCount > 0) {
            for (let i = rectangleCount - 1; i >= 0; i--) {
                const rectangle = rectangles[i];
                const adjustmentResult = rectangle.adjustForYRangeDeleted(index, count);
                if (adjustmentResult === null) {
                    rectangles.splice(i, 1);
                } else {
                    if (adjustmentResult) {
                        changed = true;
                    }
                }
            }
        }
        return changed;
    }

    adjustForYRangeMoved(oldIndex: number, newIndex: number, count: number): boolean {
        const rectangles = this.rectangles;
        const rectangleCount = rectangles.length;
        let changed: boolean;
        if (rectangleCount === 0) {
            changed = false;
        } else {
            // this could probably be better optimised
            changed = this.adjustForYRangeDeleted(oldIndex, count);
            if (this.adjustForYRangeInserted(newIndex, count)) {
                changed = true;
            }
        }
        return changed;
    }

    adjustForXRangeInserted(index: number, count: number): boolean {
        const rectangles = this.rectangles;
        const rectangleCount = rectangles.length;
        let changed = false;
        if (rectangleCount > 0) {
            for (let i = this.rectangles.length - 1; i >= 0; i--) {
                const rectangle = rectangles[i];
                if (rectangle.adjustForXRangeInserted(index, count)) {
                    changed = true;
                }
            }
        }
        return changed;
    }

    adjustForXRangeDeleted(index: number, count: number): boolean {
        const rectangles = this.rectangles;
        const rectangleCount = rectangles.length;
        let changed = false;
        if (rectangleCount > 0) {
            for (let i = this.rectangles.length - 1; i >= 0; i--) {
                const rectangle = rectangles[i];
                const adjustedResult = rectangle.adjustForXRangeDeleted(index, count);
                if (adjustedResult === null) {
                    rectangles.splice(i, 1);
                } else {
                    if (adjustedResult) {
                        changed = true;
                    }
                }
            }
        }
        return changed;
    }
}
