import { HoverCell } from '../../interfaces/data/hover-cell';
import { ViewCell } from '../../interfaces/data/view-cell';
import { Point } from '../../types-utils/point';
import { CanvasManager } from '../canvas/canvas-manager';
import { EventDetail } from '../event/event-detail';
import { ViewLayout } from '../view/view-layout';

/** @public */
export class Mouse {
    /** @internal */
    cellEnteredEventer: Mouse.CellEnteredExitedEventer;
    /** @internal */
    cellExitedEventer: Mouse.CellEnteredExitedEventer;
    /** @internal */
    viewCellRenderInvalidatedEventer: Mouse.ViewCellRenderInvalidatedEventer;
    /** @internal */
    private _activeDragType: EventDetail.DragTypeEnum | undefined;
    /** @internal */
    private _canvasOffsetPoint: Point | undefined;
    /** @internal */
    private _hoverCell: ViewCell | undefined;
    /** @internal */
    private _operationCursorName: string | undefined; // gets priority over hover cell and location cursor
    /** @internal */
    private _locationCursorName: string | undefined; // gets priority over hover cell cursor

    /** @internal */
    constructor(
        /** @internal */
        private readonly _canvasManager: CanvasManager,
        /** @internal */
        private readonly _viewLayout: ViewLayout,
    ) {
        this._viewLayout.cellPoolComputedEventerForMouse = () => this.processViewLayoutComputed();
    }

    get activeDragType() { return this._activeDragType; }
    get hoverCell() { return this._hoverCell; }

    /** @internal */
    reset() {
        this._canvasOffsetPoint = undefined;
        this._hoverCell = undefined;
        this._operationCursorName = undefined;
        this._locationCursorName = undefined;
    }

    /** @internal */
    setMouseCanvasOffset(canvasOffsetPoint: Point | undefined, cell: ViewCell | undefined) {
        this._canvasOffsetPoint = canvasOffsetPoint;
        this.updateHoverCell(cell, true);
    }

    /** @internal */
    setOperationCursor(cursorName: string | undefined) {
        if (cursorName !== this._operationCursorName) {
            this._operationCursorName = cursorName;
            this.updateOperationLocationCursor();
        }
    }

    /** @internal */
    setLocationCursor(cursorName: string | undefined) {
        if (cursorName !== this._locationCursorName) {
            this._locationCursorName = cursorName;
            this.updateOperationLocationCursor();
        }
    }

    /** @internal */
    setActiveDragType(value: EventDetail.DragTypeEnum | undefined) {
        this._activeDragType = value;
    }

    /** @internal */
    private processViewLayoutComputed() {
        let newHoverCell: HoverCell | undefined;
        const canvasOffsetPoint = this._canvasOffsetPoint;
        if (canvasOffsetPoint === undefined) {
            newHoverCell = undefined;
        } else {
            newHoverCell = this._viewLayout.findHoverCell(canvasOffsetPoint.x, canvasOffsetPoint.y);
        }

        this.updateHoverCell(newHoverCell, false);
    }

    /** @internal */
    private updateHoverCell(cell: ViewCell | undefined, invalidateViewCellRender: boolean) {
        const existingHoverCell = this._hoverCell;
        if (cell === undefined) {
            if (existingHoverCell !== undefined) {
                this._hoverCell = undefined;
                this.updateHoverCursorAndTitleText();
                this.cellExitedEventer(existingHoverCell);
                if (invalidateViewCellRender) {
                    this.viewCellRenderInvalidatedEventer(existingHoverCell);
                }
            }
        } else {
            if (existingHoverCell === undefined) {
                this._hoverCell = cell;
                this.cellEnteredEventer(cell);
                this.updateHoverCursorAndTitleText();
                if (invalidateViewCellRender) {
                    this.viewCellRenderInvalidatedEventer(cell);
                }
            } else {
                if (!ViewCell.sameByDataPoint(existingHoverCell, cell)) {
                    this._hoverCell = undefined;
                    this.cellExitedEventer(existingHoverCell);
                    if (invalidateViewCellRender) {
                        this.viewCellRenderInvalidatedEventer(existingHoverCell);
                    }
                    this._hoverCell = cell;
                    this.cellEnteredEventer(cell);
                    if (invalidateViewCellRender) {
                        this.viewCellRenderInvalidatedEventer(cell);
                    }
                    this.updateHoverCursorAndTitleText();
                }
            }
        }
    }

    /** @internal */
    private updateHoverCursorAndTitleText() {
        if (this._operationCursorName === undefined && this._locationCursorName === undefined) {
            if (this._hoverCell === undefined) {
                this._canvasManager.setCursorAndTitleText(undefined, '');
            } else {
                const cursorNameAndTitleText = this.getCellCursorNameAndTitleText();
                if (cursorNameAndTitleText === undefined) {
                    this._canvasManager.setCursorAndTitleText(undefined, '');
                } else {
                    this._canvasManager.setCursorAndTitleText(cursorNameAndTitleText.cursorName, cursorNameAndTitleText.titleText);
                }
            }
        }
    }

    /** @internal */
    private updateOperationLocationCursor() {
        let titleText: string;
        let cursorName: string | undefined;
        if (this._operationCursorName !== undefined) {
            titleText = '';
            cursorName = this._operationCursorName;
        } else {
            if (this._locationCursorName !== undefined) {
                titleText = '';
                cursorName = this._locationCursorName;
            } else {
                const cursorNameAndTitleText = this.getCellCursorNameAndTitleText();
                if (cursorNameAndTitleText === undefined) {
                    titleText = '';
                } else {
                    cursorName = cursorNameAndTitleText.cursorName;
                    titleText = cursorNameAndTitleText.titleText;
                }
            }
        }
        this._canvasManager.setCursorAndTitleText(cursorName, titleText);


        if (this._operationCursorName === undefined && this._locationCursorName === undefined) {
            if (this._hoverCell === undefined) {
                this._canvasManager.setCursorAndTitleText(undefined, '');
            } else {
                const cursorNameAndTitleText = this.getCellCursorNameAndTitleText();
                if (cursorNameAndTitleText === undefined) {
                    this._canvasManager.setCursorAndTitleText(undefined, '');
                } else {
                    this._canvasManager.setCursorAndTitleText(cursorNameAndTitleText.cursorName, cursorNameAndTitleText.titleText);
                }
            }
        }
    }

    /** @internal */
    private getCellCursorNameAndTitleText(): Mouse.CursorNameAndTitleText | undefined {
        const cell = this._hoverCell;
        if (cell === undefined) {
            return undefined;
        } else {
            const dataServer = cell.subgrid.dataServer;
            let cursorName: string | undefined;
            if (dataServer.getCursorName !== undefined) {
                cursorName = dataServer.getCursorName(cell.viewLayoutColumn.column.schemaColumn, cell.viewLayoutRow.subgridRowIndex);
            }
            let titleText: string;
            if (dataServer.getTitleText === undefined) {
                titleText = '';
            } else {
                titleText = dataServer.getTitleText(cell.viewLayoutColumn.column.schemaColumn, cell.viewLayoutRow.subgridRowIndex);
            }

            return {
                cursorName,
                titleText,
            };
        }
    }
}

/** @public */
export namespace Mouse {
    /** @internal */
    export type CellEnteredExitedEventer = (this: void, cell: ViewCell) => void;
    export type ViewCellRenderInvalidatedEventer = (this: void, cell: ViewCell) => void;

    /** @internal */
    export interface CursorNameAndTitleText {
        readonly cursorName: string | undefined;
        readonly titleText: string;
    }
}
