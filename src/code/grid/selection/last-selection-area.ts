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

}
