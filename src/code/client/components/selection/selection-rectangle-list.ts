import { RevInexclusiveRectangle } from '../../types-utils/inexclusive-rectangle';
import { revCalculateNumberArrayUniqueCount } from '../../types-utils/utils';
import { RevSelectionAreaList } from './selection-area-list';
import { RevSelectionRectangle } from './selection-rectangle';

export class RevSelectionRectangleList implements RevSelectionAreaList {
    readonly rectangles: RevSelectionRectangle[] = [];
    private readonly _flattenedX = new Array<RevInexclusiveRectangle>();
    private readonly _flattenedY = new Array<RevInexclusiveRectangle>();

    get has() { return this.rectangles.length !== 0; }
    get areaCount() { return this.rectangles.length; }

    assign(other: RevSelectionRectangleList) {
        const count = other.areaCount;

        const otherRectangles = other.rectangles;
        const rectangles = this.rectangles;
        rectangles.length = count;
        for (let i = 0; i < count; i++) {
            const otherRectangle = otherRectangles[i];
            rectangles[i] = otherRectangle.createCopy();
        }
    }

    isEmpty() { return this.rectangles.length === 0; }
    hasPoints() { return this.rectangles.length > 0; }

    hasMoreThanOnePoint() {
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

    hasPointOtherThan(x: number, y: number) {
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

    clear() {
        this.rectangles.length = 0;
        this._flattenedX.length = 0;
        this._flattenedY.length = 0;
    }

    getLastRectangle() {
        const rectangles = this.rectangles;
        if (rectangles.length > 0) {
            return rectangles[rectangles.length - 1];
        } else {
            return undefined;
        }
    }

    getRectanglesContainingPoint(x: number, y: number) {
        const rectangles = this.rectangles;
        const result = new Array<RevSelectionRectangle>(0);
        for (const rectangle of rectangles) {
            if (rectangle.containsXY(x, y)) {
                result.push(rectangle);
            }
        }
        return result;
    }
    push(rectangle: RevSelectionRectangle) {
        this.rectangles.push(rectangle);
        // Following can be cast as InexclusiveRectangle constructor used which uses unchanged extent
        this._flattenedX.push(rectangle.newXFlattened(0));
        this._flattenedY.push(rectangle.newYFlattened(0));
    }

    only(rectangle: RevSelectionRectangle) {
        this.rectangles.length = 1;
        this.rectangles[0] = rectangle;
        this._flattenedX.length = 1;
        this._flattenedX[0] = rectangle.newXFlattened(0);
        this._flattenedY.length = 1;
        this._flattenedY[0] = rectangle.newYFlattened(0);
    }

    findIndex(ox: number, oy: number, ex: number, ey: number) {
        return this.rectangles.findIndex((rectangle) => {
            return (
                rectangle.topLeft.x === ox && rectangle.topLeft.y === oy &&
                rectangle.extent.x === ex && rectangle.extent.y === ey
            );
        });
    }

    removeAt(index: number) {
        this.rectangles.splice(index, 1);
        this._flattenedX.splice(index, 1);
        this._flattenedY.splice(index, 1);
    }

    removeLast() {
        if (this.rectangles.length === 0) {
            return false;
        } else {
            this.rectangles.length -= 1;
            this._flattenedX.length -= 1;
            this._flattenedY.length -= 1;
            return true;
        }
    }

    containsY(y: number): boolean {
        return RevInexclusiveRectangle.arrayContainsPoint(this._flattenedX, 0, y);
    }

    containsX(x: number): boolean {
        return RevInexclusiveRectangle.arrayContainsPoint(this._flattenedY, x, 0);
    }

    containsPoint(x: number, y: number) {
        return RevInexclusiveRectangle.arrayContainsPoint(this.rectangles, x, y);
    }

    getUniqueXIndices() {
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

    getNonUniqueXIndices() {
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


    getFlattenedYs() {
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

    adjustForYRangeInserted(index: number, count: number) {
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

    adjustForYRangeDeleted(index: number, count: number) {
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

    adjustForYRangeMoved(oldIndex: number, newIndex: number, count: number) {
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

    adjustForXRangeInserted(index: number, count: number) {
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

    adjustForXRangeDeleted(index: number, count: number) {
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
