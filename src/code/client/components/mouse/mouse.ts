import { RevClientObject, RevPoint, RevSchemaField, RevUnreachableCaseError } from '../../../common';
import { RevViewCell } from '../../interfaces/view-cell';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevGridSettings } from '../../settings';
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
    private _dragTypeCursorName: string | undefined; // gets priority over hover cell and action possible cursor
    /** @internal */
    private _dragTypeTitleText: string | undefined; // gets priority over hover cell and action possible titleText
    /** @internal */
    private _actionPossibleCursorName: string | undefined; // gets priority over hover cell cursor
    /** @internal */
    private _actionPossibleTitleText: string | undefined; // gets priority over hover cell titleText

    /** @internal */
    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        /** @internal */
        private readonly _gridSettings: RevGridSettings,
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
        this._dragTypeCursorName = undefined;
        this._dragTypeTitleText = undefined;
        this._actionPossibleCursorName = undefined;
        this._actionPossibleTitleText = undefined;
    }

    /** @internal */
    setMouseCanvasOffset(canvasOffsetPoint: RevPoint | undefined, cell: RevViewCell<BCS, SF> | undefined) {
        this._canvasOffsetPoint = canvasOffsetPoint;
        this.updateHoverCell(cell, true);
    }

    /** @internal */
    setActionPossible(actionPossible: RevMouse.ActionPossible | undefined, cursorName: string | undefined, titleText: string | undefined) {
        if (actionPossible === undefined) {
            cursorName = undefined;
            titleText = undefined;
        } else {
            switch (actionPossible) {
                case RevMouse.ActionPossible.linkNavigate:
                    cursorName = 'pointer';
                    titleText = undefined;
                    break;
                case RevMouse.ActionPossible.columnSort:
                    cursorName = this._gridSettings.columnSortPossibleCursorName;
                    titleText = this._gridSettings.columnSortPossibleTitleText;
                    break;
                case RevMouse.ActionPossible.columnResizeDrag:
                    cursorName = this._gridSettings.columnResizeDragPossibleCursorName;
                    titleText = this._gridSettings.columnResizeDragPossibleTitleText;
                    break;
                case RevMouse.ActionPossible.columnMoveDrag:
                    cursorName = this._gridSettings.columnMoveDragPossibleCursorName;
                    titleText = this._gridSettings.columnMoveDragPossibleTitleText;
                    break;
                case RevMouse.ActionPossible.cellEdit:
                    // use parameter cursorName and titleText
                    break;
                default:
                    throw new RevUnreachableCaseError('MSAP67721', actionPossible);
            }
        }
        if (cursorName !== this._actionPossibleCursorName || titleText !== this._actionPossibleTitleText) {
            this._actionPossibleCursorName = cursorName;
            this._actionPossibleTitleText = titleText;
            this.updateActionPossibleDragType();
        }
    }

    /** @internal */
    setActiveDragType(value: RevMouse.DragType | undefined) {
        this._activeDragType = value;

        if (value === undefined) {
            this.setDragTypeCursorNameAndTitleText(undefined, undefined);
        } else{
            switch (value) {
                case RevMouse.DragType.lastRectangleSelectionAreaExtending:
                case RevMouse.DragType.lastColumnSelectionAreaExtending:
                case RevMouse.DragType.lastRowSelectionAreaExtending:
                    this.setDragTypeCursorNameAndTitleText(this._gridSettings.mouseLastSelectionAreaExtendingDragActiveCursorName, this._gridSettings.mouseLastSelectionAreaExtendingDragActiveTitleText);
                    break;
                case RevMouse.DragType.columnResizing:
                    this.setDragTypeCursorNameAndTitleText(this._gridSettings.columnResizeDragActiveCursorName, this._gridSettings.columnResizeDragActiveTitleText);
                    break;
                case RevMouse.DragType.columnMoving:
                    this.setDragTypeCursorNameAndTitleText(this._gridSettings.columnMoveDragActiveCursorName, this._gridSettings.columnMoveDragActiveTitleText);
                    break;
                default:
                    throw new RevUnreachableCaseError('MSADT67721', value);
            }
        }
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
        if (this._dragTypeCursorName === undefined && this._actionPossibleCursorName === undefined) {
            if (this._hoverCell === undefined) {
                this._canvas.setCursor(undefined);
            } else {
                const cursorName = this.getCellCursorName();
                this._canvas.setCursor(cursorName);
            }
        }

        if (this._dragTypeTitleText === undefined && this._actionPossibleTitleText === undefined) {
            if (this._hoverCell === undefined) {
                this._canvas.setTitleText('');
            } else {
                const titleText = this.getCellTitleText();
                this._canvas.setTitleText(titleText);
            }
        }
    }

    /** @internal */
    private updateActionPossibleDragType() {
        let cursorName: string | undefined;
        if (this._dragTypeCursorName !== undefined) {
            cursorName = this._dragTypeCursorName;
        } else {
            if (this._actionPossibleCursorName !== undefined) {
                cursorName = this._actionPossibleCursorName;
            } else {
                cursorName = this.getCellCursorName();
            }
        }
        this._canvas.setCursor(cursorName);

        let titleText: string;
        if (this._dragTypeTitleText !== undefined) {
            titleText = this._dragTypeTitleText;
        } else {
            if (this._actionPossibleTitleText !== undefined) {
                titleText = this._actionPossibleTitleText;
            } else {
                titleText = this.getCellTitleText();
            }
        }
        this._canvas.setTitleText(titleText);
    }

    /** @internal */
    private setDragTypeCursorNameAndTitleText(cursorName: string | undefined, titleText: string | undefined) {
        if (cursorName !== this._dragTypeCursorName || titleText !== this._dragTypeTitleText) {
            this._dragTypeCursorName = cursorName;
            this._dragTypeTitleText = titleText;
            this.updateActionPossibleDragType();
        }
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

    export type ActionPossible =
        typeof ActionPossible.linkNavigate |
        typeof ActionPossible.columnSort |
        typeof ActionPossible.columnResizeDrag |
        typeof ActionPossible.columnMoveDrag |
        typeof ActionPossible.cellEdit;

    export namespace ActionPossible {
        export const linkNavigate = 'linkNavigate';
        export const columnSort = 'columnSortPossible';
        export const columnResizeDrag = 'columnResizeDragPossible';
        export const columnMoveDrag = 'columnMoveDragPossible';
        export const cellEdit = 'cellEditPossible';
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
