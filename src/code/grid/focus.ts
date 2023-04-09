import { SubgridInterface } from './common/subgrid-interface';
import { Point } from './lib/point';
import { Subgrid } from './subgrid/subgrid';

export class Focus {
    subgridChanged_SelectionEventer: Focus.SubgridChangeEventer;

    private _subgrid: Subgrid;
    private _point: Point | undefined;

    get subgrid() { return this._subgrid; }
    set subgrid(value: Subgrid) {
        if (value !== this.subgrid) {
            value = this.subgrid;
            this.notifySubgridChanged();
        }
    }

    get x() { return this._point === undefined ? undefined : this._point.x; }
    get y() { return this._point === undefined ? undefined : this._point.y; }

    get point() { return this._point; }

    setXCoordinate(x: number) {
        const y = this._point === undefined ? 0 : this._point.y;

        this._point = {
            x,
            y,
        };
    }

    setYCoordinateAndSubgrid(y: number, subgrid: Subgrid) {
        const x = this._point === undefined ? 0 : this._point.x;

        this._point = {
            x,
            y,
        };

        if (subgrid !== this._subgrid) {
            this._subgrid = subgrid;

            this.notifySubgridChanged();
        }
    }

    setXYCoordinatesAndSubgrid(x: number, y: number, subgrid: Subgrid) {
        this._point = {
            x,
            y,
        };

        if (subgrid !== this._subgrid) {
            this._subgrid = subgrid;

            this.notifySubgridChanged();
        }
    }

    isRowFocused(rowIndex: number, subgrid: SubgridInterface) {
        return subgrid === this._subgrid && this._point !== undefined && rowIndex === this._point.y;
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
