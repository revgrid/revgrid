import { SubgridInterface } from './common/subgrid-interface';
import { AssertError } from './grid-public-api';
import { Point } from './lib/point';

export class Focus {
    private readonly _subgridChangedEventHandlers = new Array<Focus.SubgridChangeEventHandler>();

    private _subgrid: SubgridInterface;
    private _point: Point | undefined;

    private _previousSubgrid: SubgridInterface;
    private _previousPoint: Point | undefined;

    constructor(initialSubgrid: SubgridInterface) {
        this._subgrid = initialSubgrid;
        this._previousSubgrid = initialSubgrid;
    }

    get subgrid() { return this._subgrid; }
    set subgrid(value: SubgridInterface) {
        if (value !== this.subgrid) {
            this._previousSubgrid = this._subgrid;
            value = this.subgrid;
            this.notifySubgridChanged();
        }
    }

    get x() { return this._point === undefined ? undefined : this._point.x; }
    get y() { return this._point === undefined ? undefined : this._point.y; }

    get point() { return this._point; }

    get previousSubgrid() { return this._previousSubgrid; }
    get previousPoint() { return this._previousPoint; }

    setXCoordinate(x: number) {
        if (this._point === undefined || this._point.x !== x) {
            this._previousPoint = this._point;
            const y = this._point === undefined ? 0 : this._point.y;

            this._point = {
                x,
                y,
            };
        }
    }

    setYCoordinateAndSubgrid(y: number, subgrid: SubgridInterface) {
        if (this._point === undefined || this._point.y !== y) {
            this._previousPoint = this._point;
            const x = this._point === undefined ? 0 : this._point.x;
            this._point = {
                x,
                y,
            };
        }

        this.subgrid = subgrid; // use setter
    }

    setXYCoordinatesAndSubgrid(x: number, y: number, subgrid: SubgridInterface) {
        if (this._point === undefined || this._point.x !== x || this._point.y !== y) {
            this._previousPoint = this._point;
            this._point = {
                x,
                y,
            };
        }

        this.subgrid = subgrid; // use setter
    }

    isRowFocused(rowIndex: number, subgrid: SubgridInterface) {
        return subgrid === this._subgrid && this._point !== undefined && rowIndex === this._point.y;
    }

    subscribeSubgridChangedEvent(handler: Focus.SubgridChangeEventHandler) {
        this._subgridChangedEventHandlers.push(handler);
    }

    unsubscribeSubgridChangedEvent(handler: Focus.SubgridChangeEventHandler) {
        const index = this._subgridChangedEventHandlers.findIndex((h) => h === handler);
        if (index >= 0) {
            this._subgridChangedEventHandlers.splice(index, 1);
        } else {
            throw new AssertError('FUSCE2330');
        }
    }

    private notifySubgridChanged() {
        const handlers = this._subgridChangedEventHandlers.slice();
        for (const handler of handlers) {
            handler();
        }
    }
}

export namespace Focus {
    export type SubgridChangeEventHandler = (this: void) => void;
}
