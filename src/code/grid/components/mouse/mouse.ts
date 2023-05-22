import { Point } from '../../lib/point';
import { CanvasEx } from '../canvas-ex/canvas-ex';
import { ViewCell } from '../cell/view-cell';
import { ViewLayout } from '../view/view-layout';

export class Mouse {
    private _canvasOffsetPoint: Point | undefined;
    private _hoverCell: ViewCell | undefined;
    private _operationCursorName: string | undefined; // gets priority over hover cell cursor

    constructor(
        private readonly _canvasEx: CanvasEx,
        private readonly _viewLayout: ViewLayout,
        private readonly _cellEnteredEventer: Mouse.CellEventer,
        private readonly _cellExitedEventer: Mouse.CellEventer,
    ) {
        this._viewLayout.cellPoolComputedEventerForMouse = () => this.processViewLayoutComputed();
    }

    get hoverCell() { return this._hoverCell; }

    reset() {
        this._canvasOffsetPoint = undefined;
        this._hoverCell = undefined;
        this._operationCursorName = undefined;
    }

    setMouseCanvasOffset(canvasOffsetPoint: Point | undefined, hoverCell: ViewCell | undefined) {
        this._canvasOffsetPoint = canvasOffsetPoint;
        this.updateHoverCell(hoverCell, true);
    }

    setOperationCursor(cursorName: string | undefined) {
        this._operationCursorName = cursorName;
        let titleText: string;
        if (cursorName !== undefined) {
            titleText = '';
        } else {
            const cursorNameAndTitleText = this.getCellCursorNameAndTitleText();
            if (cursorNameAndTitleText === undefined) {
                titleText = '';
            } else {
                cursorName = cursorNameAndTitleText.cursorName;
                titleText = cursorNameAndTitleText.titleText;
            }
        }
        this._canvasEx.setCursorAndTitleText(cursorName, titleText);
    }

    private processViewLayoutComputed() {
        let newHoverCell: ViewCell | undefined;
        const canvasOffsetPoint = this._canvasOffsetPoint;
        if (canvasOffsetPoint === undefined) {
            newHoverCell = undefined;
        } else {
            newHoverCell = this._viewLayout.findLeftGridLineInclusiveCellFromCanvasOffset(canvasOffsetPoint.x, canvasOffsetPoint.y);
        }

        this.updateHoverCell(newHoverCell, false);
    }

    private updateHoverCell(newHoverCell: ViewCell | undefined, invalidateViewCellRender: boolean) {
        const existingHoverCell = this._hoverCell;
        if (newHoverCell === undefined) {
            if (existingHoverCell !== undefined) {
                this._hoverCell = undefined;
                this.updateCursorAndTitleText();
                this._cellExitedEventer(existingHoverCell, invalidateViewCellRender);
            }
        } else {
            if (existingHoverCell === undefined) {
                this._hoverCell = newHoverCell;
                this._cellEnteredEventer(newHoverCell, invalidateViewCellRender);
                this.updateCursorAndTitleText();
            } else {
                if (!ViewCell.sameByDataPoint(existingHoverCell, newHoverCell)) {
                    this._hoverCell = undefined;
                    this._cellExitedEventer(existingHoverCell, invalidateViewCellRender);
                    this._hoverCell = newHoverCell;
                    this._cellEnteredEventer(newHoverCell, invalidateViewCellRender);
                    this.updateCursorAndTitleText();
                }
            }
        }
    }

    private updateCursorAndTitleText() {
        if (this._operationCursorName === undefined) {
            if (this._hoverCell === undefined) {
                this._canvasEx.setCursorAndTitleText(undefined, '');
            } else {
                const cursorNameAndTitleText = this.getCellCursorNameAndTitleText();
                if (cursorNameAndTitleText === undefined) {
                    this._canvasEx.setCursorAndTitleText(undefined, '');
                } else {
                    this._canvasEx.setCursorAndTitleText(cursorNameAndTitleText.cursorName, cursorNameAndTitleText.titleText);
                }
            }
        }
    }

    private getCellCursorNameAndTitleText(): Mouse.CursorNameAndTitleText | undefined {
        const cell = this._hoverCell;
        if (cell === undefined) {
            return undefined;
        } else {
            const dataModel = cell.subgrid.dataModel;
            let cursorName: string | undefined;
            if (dataModel.getCursorName !== undefined) {
                cursorName = dataModel.getCursorName(cell.viewLayoutColumn.column.schemaColumn, cell.viewLayoutRow.subgridRowIndex);
            }
            let titleText: string;
            if (dataModel.getTitleText === undefined) {
                titleText = '';
            } else {
                titleText = dataModel.getTitleText(cell.viewLayoutColumn.column.schemaColumn, cell.viewLayoutRow.subgridRowIndex);
            }

            return {
                cursorName,
                titleText,
            };
        }
    }
}

export namespace Mouse {
    export type CellEventer = (this: void, cell: ViewCell, invalidateViewCellRender: boolean) => void;

    export interface CursorNameAndTitleText {
        readonly cursorName: string | undefined;
        readonly titleText: string;
    }
}
