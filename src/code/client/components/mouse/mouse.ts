import { RevClientObject, RevPoint, RevSchemaField } from '../../../common';
import { RevViewCell } from '../../interfaces/view-cell';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../../settings';
import { RevCanvas } from '../canvas/canvas';
import { RevViewLayout } from '../view/view-layout';

/** @public */
export class RevMouse<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevClientObject {
    /** @internal */
    cellEnteredEventer: RevMouse.CellEnteredExitedEventer<BCS, SF>;
    /** @internal */
    cellExitedEventer: RevMouse.CellEnteredExitedEventer<BCS, SF>;
    /** @internal */
    viewCellRenderInvalidatedEventer: RevMouse.ViewCellRenderInvalidatedEventer<BCS, SF>;
    /** @internal */
    private _activeDragType: RevMouse.DragType | undefined;
    /** @internal */
    private _canvasOffsetPoint: RevPoint | undefined;
    /** @internal */
    private _hoverCell: RevViewCell<BCS, SF> | undefined;
    /** @internal */
    private _operationCursorName: string | undefined; // gets priority over hover cell and location cursor
    /** @internal */
    private _operationTitleText: string | undefined; // gets priority over hover cell and location cursor
    /** @internal */
    private _locationCursorName: string | undefined; // gets priority over hover cell cursor
    /** @internal */
    private _locationTitleText: string | undefined; // gets priority over hover cell cursor

    /** @internal */
    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        /** @internal */
        private readonly _canvas: RevCanvas<BGS>,
        /** @internal */
        private readonly _viewLayout: RevViewLayout<BGS, BCS, SF>,
    ) {
        this._viewLayout.cellPoolComputedEventerForMouse = () => { this.processViewLayoutComputed(); };
    }

    get activeDragType() { return this._activeDragType; }
    get hoverCell() { return this._hoverCell; }

    /** @internal */
    reset() {
        this._canvasOffsetPoint = undefined;
        this._hoverCell = undefined;
        this._operationCursorName = undefined;
        this._operationTitleText = undefined;
        this._locationCursorName = undefined;
        this._locationTitleText = undefined;
    }

    /** @internal */
    setMouseCanvasOffset(canvasOffsetPoint: RevPoint | undefined, cell: RevViewCell<BCS, SF> | undefined) {
        this._canvasOffsetPoint = canvasOffsetPoint;
        this.updateHoverCell(cell, true);
    }

    /** @internal */
    setOperation(cursorName: string | undefined, titleText: string | undefined) {
        if (cursorName !== this._operationCursorName || titleText !== this._operationTitleText) {
            this._operationCursorName = cursorName;
            this._operationTitleText = titleText;
            this.updateOperationLocation();
        }
    }

    /** @internal */
    setLocation(cursorName: string | undefined, titleText: string | undefined) {
        if (cursorName !== this._locationCursorName || titleText !== this._locationTitleText) {
            this._locationCursorName = cursorName;
            this._locationTitleText = titleText;
            this.updateOperationLocation();
        }
    }

    /** @internal */
    setActiveDragType(value: RevMouse.DragType | undefined) {
        this._activeDragType = value;
    }

    /** @internal */
    private processViewLayoutComputed() {
        let newHoverCell: RevViewCell<BCS, SF> | undefined;
        const canvasOffsetPoint = this._canvasOffsetPoint;
        if (canvasOffsetPoint === undefined) {
            newHoverCell = undefined;
        } else {
            newHoverCell = this._viewLayout.findCellAtCanvasOffsetSpecifyRecompute(canvasOffsetPoint.x, canvasOffsetPoint.y, false);
        }

        this.updateHoverCell(newHoverCell, false);
    }

    /** @internal */
    private updateHoverCell(cell: RevViewCell<BCS, SF> | undefined, invalidateViewCellRender: boolean) {
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
                if (!RevViewCell.sameByDataPoint(existingHoverCell, cell)) {
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
                this._canvas.setCursor(undefined);
            } else {
                const cursorName = this.getCellCursorName();
                this._canvas.setCursor(cursorName);
            }
        }

        if (this._operationTitleText === undefined && this._locationTitleText === undefined) {
            if (this._hoverCell === undefined) {
                this._canvas.setTitleText('');
            } else {
                const titleText = this.getCellTitleText();
                this._canvas.setTitleText(titleText);
            }
        }
    }

    /** @internal */
    private updateOperationLocation() {
        let cursorName: string | undefined;
        if (this._operationCursorName !== undefined) {
            cursorName = this._operationCursorName;
        } else {
            if (this._locationCursorName !== undefined) {
                cursorName = this._locationCursorName;
            } else {
                cursorName = this.getCellCursorName();
            }
        }
        this._canvas.setCursor(cursorName);

        let titleText: string;
        if (this._operationTitleText !== undefined) {
            titleText = this._operationTitleText;
        } else {
            if (this._locationTitleText !== undefined) {
                titleText = this._locationTitleText;
            } else {
                titleText = this.getCellTitleText();
            }
        }
        this._canvas.setTitleText(titleText);
    }

    /** @internal */
    private getCellCursorName(): string | undefined {
        const cell = this._hoverCell;
        if (cell === undefined) {
            return undefined;
        } else {
            const dataServer = cell.subgrid.dataServer;
            if (dataServer.getCursorName === undefined) {
                return undefined;
            } else {
                return dataServer.getCursorName(cell.viewLayoutColumn.column.field, cell.viewLayoutRow.subgridRowIndex);
            }
        }
    }

    /** @internal */
    private getCellTitleText(): string {
        const cell = this._hoverCell;
        if (cell === undefined) {
            return '';
        } else {
            const dataServer = cell.subgrid.dataServer;
            if (dataServer.getTitleText === undefined) {
                return '';
            } else {
                return dataServer.getTitleText(cell.viewLayoutColumn.column.field, cell.viewLayoutRow.subgridRowIndex);
            }
        }
    }
}

/** @public */
export namespace RevMouse {
    export type DragType =
        typeof DragType.lastRectangleSelectionAreaExtending |
        typeof DragType.lastColumnSelectionAreaExtending |
        typeof DragType.lastRowSelectionAreaExtending |
        typeof DragType.columnResizing |
        typeof DragType.columnMoving;

    export namespace DragType {
        // Make sure values are all lower case so could be used in Drag Drop API
        export const lastRectangleSelectionAreaExtending = 'revgridlastrectangleselectionareaextending';
        export const lastColumnSelectionAreaExtending = 'revgridlastcolumnselectionareaextending';
        export const lastRowSelectionAreaExtending = 'revgridlastrowselectionareaextending';
        export const columnResizing = 'revgridcolumnresizing';
        export const columnMoving = 'revgridcolumnmoving';
    }

    /** @internal */
    export type CellEnteredExitedEventer<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = (this: void, cell: RevViewCell<BCS, SF>) => void;
    export type ViewCellRenderInvalidatedEventer<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = (this: void, cell: RevViewCell<BCS, SF>) => void;

    /** @internal */
    export interface CursorNameAndTitleText {
        readonly cursorName: string | undefined;
        readonly titleText: string;
    }
}
