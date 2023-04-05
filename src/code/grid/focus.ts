import { Point } from './lib/point';
import { Subgrid } from './subgrid/subgrid';

export class Focus {
    subgridChanged_SelectionEventer: Focus.SubgridChangeEventer;

    private _subgrid: Subgrid;
    private _x: number | undefined;
    private _y: number | undefined

    constructor(initialSubgrid: Subgrid) {
        this._subgrid = initialSubgrid;
    }

    get subgrid() { return this._subgrid; }
    set subgrid(value: Subgrid) {
        if (value !== this.subgrid) {
            value = this.subgrid;
            this.notifySubgridChanged();
        }
    }

    get x() { return this._x; }
    get y() { return this._y; }

    get point(): Point | undefined {
        if (this._x === undefined || this._y === undefined) {
            return undefined;
        } else {
            return {
                x: this._x,
                y: this._y,
            };
        }
    }

    setXYCoordinatesAndSubgrid(x: number, y: number, subgrid: Subgrid) {
        const xChanged = this.x !== x;
        if (xChanged) {
            this._x = x;
        }
        const yChanged = this._y !== y;
        if (yChanged) {
            this._y = y;
        }

        if (subgrid !== this._subgrid) {
            this._subgrid = subgrid;

            this.notifySubgridChanged();
        }
    }

    setYCoordinateAndSubgrid(y: number, subgrid: Subgrid) {
        const yChanged = this._y !== y;
        if (yChanged) {
            this._y = y;
        }

        if (subgrid !== this._subgrid) {
            this._subgrid = subgrid;

            this.notifySubgridChanged();
        }
    }

    isRowFocused(rowIndex: number, subgrid: Subgrid) {
        return subgrid === this._subgrid && rowIndex === this._y;
    }

    private notifySubgridChanged() {
        if (this.subgridChanged_SelectionEventer !== undefined) {
            this.subgridChanged_SelectionEventer();
        }
    }
}

export namespace Focus {
    export type SubgridChangeEventer = (this: void) => void;
}
