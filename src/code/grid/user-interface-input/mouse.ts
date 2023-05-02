import { ViewportCell } from '../cell/viewport-cell';
import { Point } from '../lib/point';

export class Mouse {
    /**
     * The pixel location of an initial mousedown click, either for editing a cell or for dragging a selection.
     */
    private mouseDown = new Array<Point>(); // [];

    /**
     * The extent from the mousedown point during a drag operation.
     */
    dragExtent: Point | undefined;

    /**
     * The pixel location of the current hovered cell.
     * @todo Need to detect hovering over bottom totals.
     */
    private _hoverCell: ViewportCell | undefined;

    constructor(
        private readonly _cellEnteredEventer: Mouse.CellEventer,
        private readonly _cellExitedEventer: Mouse.CellEventer,
    ) {

    }

    get hoverCell() { return this._hoverCell; }

    reset() {
        this._hoverCell = undefined;
    }

    setHoverCell(cell: ViewportCell | undefined) {
        const existingHoverCell = this._hoverCell;
        if (cell === undefined) {
            if (existingHoverCell !== undefined) {
                this._hoverCell = undefined;
                this._cellExitedEventer(existingHoverCell);
            }
        } else {
            if (existingHoverCell === undefined) {
                this._hoverCell = cell;
                this._cellEnteredEventer(cell);
            } else {
                if (!Point.isEqual(existingHoverCell.dataPoint, cell.dataPoint)) {
                    this._hoverCell = undefined;
                    this._cellExitedEventer(existingHoverCell);
                    this._hoverCell = cell;
                    this._cellEnteredEventer(cell);
                }
            }
        }
    }

    /**
     * @returns The initial mouse position on a mouse down event for cell editing or a drag operation.
     */
    getMouseDown() {
        if (this.mouseDown.length > 0) {
            return this.mouseDown[this.mouseDown.length - 1];
        } else {
            return undefined;
        }
    }

    /**
     * @desc Remove the last item from the mouse down stack.
     */
    popMouseDown() {
        return this.mouseDown.pop();
    }

    /**
     * @desc Empty out the mouse down stack.
     */
    clearMouseDown() {
        this.mouseDown = [Point.create(-1, -1)];
        this.dragExtent = undefined;
    }

    /**
     * Set the mouse point that initiated a cell edit or drag operation.
     */
    setMouseDown(point: Point) {
        this.mouseDown.push(point);
    }

    /**
     * @returns The extent point of the current drag selection rectangle.
     */
    getDragExtent() {
        return this.dragExtent;
    }

    /**
     * @summary Set the extent point of the current drag selection operation.
     */
    setDragExtent(point: Point) {
        this.dragExtent = point;
    }
}

export namespace Mouse {
    export type CellEventer = (this: void, cell: ViewportCell) => void;
}
