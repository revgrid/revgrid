import { Point } from './lib/point';
import { Subgrid } from './subgrid/subgrid';

export class Focus {
    private _subgrid: Subgrid;
    private _point: Point | undefined;

    constructor(initialSubgrid: Subgrid) {
        this._subgrid = initialSubgrid;
    }

    get subgrid() { return this._subgrid; }
    get point() { return this._point; }

    isRowFocused(rowIndex: number) {
        const point = this.point;
        return (point !== undefined) && (point.y === rowIndex);
    }
}
