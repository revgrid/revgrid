import { Point } from '../../lib/point';
import { CanvasEx } from '../canvas-ex/canvas-ex';
import { ViewCell } from '../cell/view-cell';

export class Mouse {
    private _hoverCell: ViewCell | undefined;
    private _operationCursorName: string | undefined; // gets priority over hover cell cursor

    constructor(
        private readonly _canvasEx: CanvasEx,
        private readonly _cellEnteredEventer: Mouse.CellEventer,
        private readonly _cellExitedEventer: Mouse.CellEventer,
    ) {

    }

    get hoverCell() { return this._hoverCell; }

    reset() {
        this._hoverCell = undefined;
    }

    setHoverCell(cell: ViewCell | undefined) {
        const existingHoverCell = this._hoverCell;
        if (cell === undefined) {
            if (existingHoverCell !== undefined) {
                this._hoverCell = undefined;
                this.updateCursorAndTitleText();
                this._cellExitedEventer(existingHoverCell);
            }
        } else {
            if (existingHoverCell === undefined) {
                this._hoverCell = cell;
                this._cellEnteredEventer(cell);
                this.updateCursorAndTitleText();
            } else {
                if (!Point.isEqual(existingHoverCell.dataPoint, cell.dataPoint)) {
                    this._hoverCell = undefined;
                    this._cellExitedEventer(existingHoverCell);
                    this._hoverCell = cell;
                    this._cellEnteredEventer(cell);
                    this.updateCursorAndTitleText();
                }
            }
        }
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
                cursorName = dataModel.getCursorName(cell.visibleColumn.column.schemaColumn, cell.dataPoint.y);
            }
            let titleText: string;
            if (dataModel.getTitleText === undefined) {
                titleText = '';
            } else {
                titleText = dataModel.getTitleText(cell.visibleColumn.column.schemaColumn, cell.dataPoint.y);
            }

            return {
                cursorName,
                titleText,
            };
        }
    }
}

export namespace Mouse {
    export type CellEventer = (this: void, cell: ViewCell) => void;

    export interface CursorNameAndTitleText {
        readonly cursorName: string | undefined;
        readonly titleText: string;
    }
}
