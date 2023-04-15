import { Point } from '../lib/point';
import { SelectionArea } from '../lib/selection-area';

export class LastSelectionArea implements SelectionArea {
    constructor(
        readonly areaType: SelectionArea.Type,
        private _origin: Point,
        private _corner: Point,
        private _first: Point,
    ) {

    }

    get origin() { return this._origin; }
    get corner() { return this._corner; }
    get first() { return this._first; }
    get size() { return (this._corner.x - this._origin.x) * (this._corner.y - this._origin.y) }

    adjustForYRangeInserted(index: number, count: number) {
        Point.adjustForYRangeInserted(this._origin, index, count);
        Point.adjustForYRangeInserted(this._corner, index, count);
        Point.adjustForYRangeInserted(this._first, index, count);
    }

    adjustForYRangeDeleted(index: number, count: number) {
        Point.adjustForYRangeDeleted(this._origin, index, count);
        Point.adjustForYRangeDeleted(this._corner, index, count);
        Point.adjustForYRangeDeleted(this._first, index, count);
    }

    adjustForYRangeMoved(oldIndex: number, newIndex: number, count: number) {
        Point.adjustForYRangeMoved(this._origin, oldIndex, newIndex, count);
        Point.adjustForYRangeMoved(this._corner, oldIndex, newIndex, count);
        Point.adjustForYRangeMoved(this._first, oldIndex, newIndex, count);
    }

    adjustForXRangeInserted(index: number, count: number) {
        Point.adjustForXRangeInserted(this._origin, index, count);
        Point.adjustForXRangeInserted(this._corner, index, count);
        Point.adjustForXRangeInserted(this._first, index, count);
    }

    adjustForXRangeDeleted(index: number, count: number) {
        Point.adjustForXRangeDeleted(this._origin, index, count);
        Point.adjustForXRangeDeleted(this._corner, index, count);
        Point.adjustForXRangeDeleted(this._first, index, count);
    }

    adjustForXRangeMoved(oldIndex: number, newIndex: number, count: number) {
        Point.adjustForXRangeMoved(this._origin, oldIndex, newIndex, count);
        Point.adjustForXRangeMoved(this._corner, oldIndex, newIndex, count);
        Point.adjustForXRangeMoved(this._first, oldIndex, newIndex, count);
    }
}
