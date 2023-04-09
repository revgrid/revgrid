import { Selection } from './selection';
import { SelectionRectangle } from './selection-rectangle';

/** @public */
export interface SelectionDetail {
    getSelectedRowIndices(): number[]
    getSelectedColumnIndices(): number[]
    getSelectedRectangles(): SelectionRectangle[]
}

/** @internal */
export class SelectionDetailAccessor implements SelectionDetail {
    constructor(private readonly _selection: Selection) {

    }

    getSelectedRowIndices() { return this._selection.getRowIndices(); }
    getSelectedColumnIndices() { return this._selection.getColumnIndices(); }
    getSelectedRectangles() { return this._selection.rectangleList.rectangles; }
}
