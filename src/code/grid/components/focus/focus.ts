import { CellEditor } from '../../interfaces/data/cell-editor';
import { DataServer } from '../../interfaces/data/data-server';
import { MainSubgrid } from '../../interfaces/data/main-subgrid';
import { Subgrid } from '../../interfaces/data/subgrid';
import { ViewCell } from '../../interfaces/data/view-cell';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { PartialPoint, Point } from '../../types-utils/point';
import { AssertError } from '../../types-utils/revgrid-error';
import { CanvasManager } from '../canvas/canvas-manager';
import { ColumnsManager } from '../column/columns-manager';
import { ViewLayout } from '../view/view-layout';

/** @public */
export class Focus<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField<BCS>> {
    getCellEditorEventer: Focus.GetCellEditorEventer<BCS, SF> | undefined;
    editorKeyDownEventer: Focus.EditorKeyDownEventer;

    /** @internal */
    changedEventer: Focus.ChangedEventer;
    /** @internal */
    viewCellRenderInvalidatedEventer: Focus.ViewCellRenderInvalidatedEventer<BCS, SF>;

    readonly subgrid: Subgrid<BCS, SF>;
    readonly dataServer: DataServer<BCS, SF>;

    /** @internal */
    private _current: Point | undefined;
    /** @internal */
    private _previous: Point | undefined;

    // Optionally track position in canvas where focus is.  Used to assist with paging
    /** @internal */
    private _canvasX: number | undefined;
    /** @internal */
    private _canvasY: number | undefined;

    /** @internal */
    private _editor: CellEditor<BCS, SF> | undefined;
    /** @internal */
    private _cell: ViewCell<BCS, SF> | undefined;

    /** @internal */
    constructor(
        /** @internal */
        private readonly _gridSettings: BGS,
        /** @internal */
        private readonly _canvasManager: CanvasManager<BGS>,
        /** @internal */
        private readonly _mainSubgrid: MainSubgrid<BCS, SF>,
        /** @internal */
        private readonly _columnsManager: ColumnsManager<BGS, BCS, SF>,
        /** @internal */
        private readonly _viewLayout: ViewLayout<BGS, BCS, SF>,
    ) {
        this.subgrid = this._mainSubgrid;
        this.dataServer = this.subgrid.dataServer;
        this._viewLayout.cellPoolComputedEventerForFocus = () => this.handleCellPoolComputedEvent();
    }

    get currentX() { return this._current === undefined ? undefined : this._current.x; }
    get currentY() { return this._current === undefined ? undefined : this._current.y; }

    get current() { return this._current; }
    get previous() { return this._previous; }

    get canvasX() { return this._canvasX; }
    get canvasY() { return this._canvasY; }

    get editor() { return this._editor; }
    /** Do not cache as can change whenever View Layout is recomputed (even if focus and/or editor does not change) */
    get cell() { return this._cell; }

    /** @internal */
    reset() {
        this.clear();
    }

    clear() {
        this.closeFocus();
        this._previous = this._current;
        this._current = undefined;
    }

    set(newFocusPoint: Point, cell: ViewCell<BCS, SF> | undefined, canvasPoint: PartialPoint | undefined) {
        const newFocusX = newFocusPoint.x;
        const newFocusY = newFocusPoint.y;
        const currentSubgridPoint = this._current;
        const currentFocusDefined = currentSubgridPoint !== undefined;
        if (!currentFocusDefined || currentSubgridPoint.x !== newFocusX || currentSubgridPoint.y !== newFocusY) {
            this.closeFocus();
            this._previous = currentSubgridPoint;
            this._current = newFocusPoint;

            if (canvasPoint !== undefined) {
                const canvasX = canvasPoint.x;
                if (canvasX !== undefined) {
                    this._canvasX = canvasX;
                }

                const canvasY = canvasPoint.y;
                if (canvasY !== undefined) {
                    this._canvasY = canvasY;
                }
            }

            if (cell === undefined) {
                cell = this._viewLayout.findCellAtGridPoint(newFocusX, newFocusY, this.subgrid, true);
            }

            if (cell !== undefined) {
                this._cell = cell;

                if (cell.viewLayoutColumn.column.settings.editOnFocusCell) {
                    this.tryOpenEditorAtFocusedCell(cell, undefined, undefined);
                }

                this.viewCellRenderInvalidatedEventer(cell);
            }

            this.fireFocusChanged();
        }
    }

    setX(activeColumnIndex: number, cell: ViewCell<BCS, SF> | undefined, canvasX: number | undefined) {
        const currentSubgridPoint = this._current;
        const currentFocusDefined = currentSubgridPoint !== undefined;
        if (!currentFocusDefined || currentSubgridPoint.x !== activeColumnIndex) {
            this.closeFocus();
            this._previous = currentSubgridPoint;
            const y = currentFocusDefined ? currentSubgridPoint.y : this._gridSettings.fixedRowCount;

            this._current = {
                x: activeColumnIndex,
                y,
            };

            if (canvasX !== undefined) {
                this._canvasX = canvasX;
            }

            if (cell === undefined) {
                cell = this._viewLayout.findCellAtGridPoint(activeColumnIndex, y, this.subgrid, true);
            }

            if (cell !== undefined) {
                this._cell = cell;

                if (cell.viewLayoutColumn.column.settings.editOnFocusCell) {
                    this.tryOpenEditorAtFocusedCell(cell, undefined, undefined);
                }

                this.viewCellRenderInvalidatedEventer(cell);
            }

            this.fireFocusChanged();
        }
    }

    setY(subgridRowIndex: number, cell: ViewCell<BCS, SF> | undefined, canvasY: number | undefined) {
        const currentSubgridPoint = this._current;
        const currentFocusDefined = currentSubgridPoint !== undefined;
        if (!currentFocusDefined || currentSubgridPoint.y !== subgridRowIndex) {
            this.closeFocus();
            this._previous = currentSubgridPoint;
            const x = currentFocusDefined ? currentSubgridPoint.x : this._gridSettings.fixedColumnCount;
            this._current = {
                x,
                y: subgridRowIndex,
            };

            if (canvasY !== undefined) {
                this._canvasY = canvasY;
            }

            if (cell === undefined) {
                cell = this._viewLayout.findCellAtGridPoint(x, subgridRowIndex, this.subgrid, true);
            }

            if (cell !== undefined) {
                this._cell = cell;

                if (cell.viewLayoutColumn.column.settings.editOnFocusCell) {
                    this.tryOpenEditorAtFocusedCell(cell, undefined, undefined);
                }

                this.viewCellRenderInvalidatedEventer(cell);
            }

            this.fireFocusChanged();
        }
    }

    setXY(activeColumnIndex: number, subgridRowIndex: number, cell: ViewCell<BCS, SF> | undefined, canvasX: number | undefined, canvasY: number | undefined) {
        const currentSubgridPoint = this._current;
        const currentFocusDefined = currentSubgridPoint !== undefined;
        if (!currentFocusDefined || currentSubgridPoint.x !== activeColumnIndex || currentSubgridPoint.y !== subgridRowIndex) {
            this.closeFocus();
            this._previous = currentSubgridPoint;
            this._current = {
                x: activeColumnIndex,
                y: subgridRowIndex,
            };

            if (canvasX !== undefined) {
                this._canvasX = canvasX;
            }
            if (canvasY !== undefined) {
                this._canvasY = canvasY;
            }

            if (cell === undefined) {
                cell = this._viewLayout.findCellAtGridPoint(activeColumnIndex, subgridRowIndex, this.subgrid, true);
            }

            if (cell !== undefined) {
                this._cell = cell;

                if (cell.viewLayoutColumn.column.settings.editOnFocusCell) {
                    this.tryOpenEditorAtFocusedCell(cell, undefined, undefined);
                }

                this.viewCellRenderInvalidatedEventer(cell);
            }

            this.fireFocusChanged();
        }
    }

    isActiveColumnFocused(activeColumnIndex: number) {
        return this._current !== undefined && activeColumnIndex === this._current.x;
    }

    isSubgridRowFocused(subgridRowIndex: number, subgrid: Subgrid<BCS, SF>) {
        return subgrid === this._mainSubgrid && this.isMainSubgridRowFocused(subgridRowIndex);
    }

    isMainSubgridRowFocused(mainSubgridRowIndex: number) {
        return this._current !== undefined && mainSubgridRowIndex === this._current.y;
    }

    isCellFocused(cell: ViewCell<BCS, SF>) {
        return cell === this._cell;
    }

    isGridPointFocused(activeColumnIndex: number, subgridRowIndex: number, subgrid: Subgrid<BCS, SF>) {
        return subgrid === this._mainSubgrid && this.isMainSubgridGridPointFocused(activeColumnIndex, subgridRowIndex);
    }

    isMainSubgridGridPointFocused(activeColumnIndex: number, mainSubgridRowIndex: number) {
        return (
            this._current !== undefined &&
            activeColumnIndex === this._current.x &&
            mainSubgridRowIndex === this._current.y
        );
    }

    tryOpenEditor(cell: ViewCell<BCS, SF>) {
        if (cell !== this._cell) {
            // Can only open editor at Focused cell
            throw new AssertError('FTOE34349');
        } else {
            return this.tryOpenEditorAtFocusedCell(cell, undefined, undefined)
        }
    }

    closeEditor(cancel: boolean, focusCanvas: boolean) {
        const editor = this._editor;
        if (editor !== undefined) {
            const focusedPoint = this._current;
            if (focusedPoint === undefined) {
                throw new AssertError('FCE11198');
            } else {
                const column = this._columnsManager.getActiveColumn(focusedPoint.x);
                this._editor = undefined;
                editor.close(column.field, focusedPoint.y, cancel);
                this.finaliseEditor(editor);

                if (this._cell !== undefined) {
                    this.viewCellRenderInvalidatedEventer(this._cell);
                }

                if (focusCanvas) {
                    this._canvasManager.canvasElement.focus();
                }
            }
        }
    }

    checkEditorWantsKeyDownEvent(event: KeyboardEvent, fromEditor: boolean): boolean {
        const editor = this._editor;
        if (editor === undefined) {
            const cell = this._cell;
            if (cell === undefined) {
                return false; // cannot open editor if focused cell is not visible
            } else {
                const key = event.key;
                if (key === this._gridSettings.editKey) {
                    return this.tryOpenEditorAtFocusedCell(cell, undefined, undefined);
                } else {
                    if (cell.columnSettings.editOnKeyDown) {
                        return this.tryOpenEditorAtFocusedCell(cell, event, undefined);
                    } else {
                        return false;
                    }
                }
            }
        } else {
            const key = event.key;
            const focusPoint = this._current;
            if (focusPoint === undefined) {
                throw new AssertError('FCEWKDE98887');
            } else {
                const column = this._columnsManager.getActiveColumn(focusPoint.x);
                const subgridRowIndex = focusPoint.y;
                const consumed = editor.processKeyDownEvent(event, fromEditor, column.field, subgridRowIndex);
                if (consumed) {
                    return true;
                } else {
                    switch (key) {
                        case Focus.ActionKeyboardKey.Enter: {
                            this.closeEditor(false, true);
                            return true;
                        }
                        case Focus.ActionKeyboardKey.Escape: {
                            this.closeEditor(true, true);
                            return true;
                        }
                        default:
                            return false;
                    }
                }
            }
        }
    }

    checkEditorWantsClickEvent(event: MouseEvent, focusedCell: ViewCell<BCS, SF>): boolean {
        if (focusedCell !== this._cell) {
            throw new AssertError('FCEWCE59572');
        } else {
            const editor = this._editor;
            if (editor === undefined) {
                if (!focusedCell.columnSettings.editOnClick) {
                    return false;
                } else {
                    return this.tryOpenEditorAtFocusedCell(focusedCell, undefined, event);
                }
            } else {
                if (editor.processClickEvent === undefined) {
                    return false;
                } else {
                    return editor.processClickEvent(event, focusedCell);
                }
            }
        }
    }

    checkEditorProcessPointerMoveEvent(event: PointerEvent, focusedCell: ViewCell<BCS, SF>): CellEditor.PointerLocationInfo | undefined {
        if (focusedCell !== this._cell) {
            throw new AssertError('FCEWCE59572');
        } else {
            const editor = this._editor;
            if (editor === undefined) {
                return undefined;
            } else {
                if (editor.processPointerMoveEvent === undefined) {
                    return undefined;
                } else {
                    return editor.processPointerMoveEvent(event, focusedCell);
                }
            }
        }
    }

    /** @internal */
    adjustForRowsInserted(rowIndex: number, rowCount: number, dataServer: DataServer<BCS, SF>) {
        if (dataServer === this._mainSubgrid.dataServer) {
            if (this._current !== undefined) {
                Point.adjustForYRangeInserted(this._current, rowIndex, rowCount);
            }
            if (this._previous !== undefined) {
                Point.adjustForYRangeInserted(this._previous, rowIndex, rowCount);
            }

            this._canvasY = undefined;
        }
    }

    /** @internal */
    adjustForRowsDeleted(rowIndex: number, rowCount: number, dataServer: DataServer<BCS, SF>) {
        if (dataServer === this._mainSubgrid.dataServer) {
            if (this._current !== undefined) {
                const positionInDeletionRange = Point.adjustForYRangeDeleted(this._current, rowIndex, rowCount);
                if (positionInDeletionRange !== undefined) {
                    this._current = undefined;
                }
            }
            if (this._previous !== undefined) {
                const positionInDeletionRange = Point.adjustForYRangeDeleted(this._previous, rowIndex, rowCount);
                if (positionInDeletionRange !== undefined) {
                    this._previous = undefined;
                }
            }

            this._canvasY = undefined;
        }
    }

    /** @internal */
    adjustForRowsMoved(oldRowIndex: number, newRowIndex: number, count: number, dataServer: DataServer<BCS, SF>) {
        if (dataServer === this._mainSubgrid.dataServer) {
            if (this._current !== undefined) {
                Point.adjustForYRangeMoved(this._current, oldRowIndex, newRowIndex, count);
            }
            if (this._previous !== undefined) {
                Point.adjustForYRangeMoved(this._previous, oldRowIndex, newRowIndex, count);
            }

            this._canvasY = undefined;
        }
    }

    /** @internal */
    adjustForColumnsInserted(columnIndex: number, columnCount: number) {
        if (this._current !== undefined) {
            Point.adjustForXRangeInserted(this._current, columnIndex, columnCount);
        }
        if (this._previous !== undefined) {
            Point.adjustForXRangeInserted(this._previous, columnIndex, columnCount);
        }

        this._canvasX = undefined;
    }

    /** @internal */
    adjustForColumnsDeleted(columnIndex: number, columnCount: number) {
        if (this._current !== undefined) {
            const positionInDeletionRange = Point.adjustForXRangeDeleted(this._current, columnIndex, columnCount);
            if (positionInDeletionRange !== undefined) {
                this._current = undefined;
            }
        }
        if (this._previous !== undefined) {
            const positionInDeletionRange = Point.adjustForXRangeDeleted(this._previous, columnIndex, columnCount);
            if (positionInDeletionRange !== undefined) {
                this._previous = undefined;
            }
        }

        this._canvasX = undefined;
    }

    /** @internal */
    adjustForColumnsMoved(oldColumnIndex: number, newColumnIndex: number, count: number) {
        if (this._current !== undefined) {
            Point.adjustForXRangeMoved(this._current, oldColumnIndex, newColumnIndex, count);
        }
        if (this._previous !== undefined) {
            Point.adjustForXRangeMoved(this._previous, oldColumnIndex, newColumnIndex, count);
        }

        this._canvasX = undefined;
    }

    /** @internal */
    createStash(): Focus.Stash {
        let currentStashPoint: Focus.Stash.Point | undefined;
        if (this._current !== undefined) {
            currentStashPoint = this.createStashPoint(this._current);
        }
        let previousStashPoint: Focus.Stash.Point | undefined;
        if (this._previous !== undefined) {
            previousStashPoint = this.createStashPoint(this._previous);
        }

        return {
            current: currentStashPoint,
            previous: previousStashPoint,
        }
    }

    /** @internal */
    restoreStash(stash: Focus.Stash) {
        this.clear();

        if (stash.current !== undefined) {
            this._current = this.createPointFromStash(stash.current);
        }
        if (stash.previous !== undefined) {
            this._previous = this.createPointFromStash(stash.previous);
        }
    }

    /** @internal */
    private handleEditorClosed(value: DataServer.ViewValue | undefined) {
        const editor = this._editor;
        if (editor !== undefined) {
            this._editor = undefined;
            this.finaliseEditor(editor);
        }
    }

    /** @internal */
    private handleCellPoolComputedEvent() {
        // Called within Request Animation Frame. Do not call any external code.
        const focusPoint = this._current;
        if (focusPoint !== undefined) {
            const cell = this._viewLayout.findCellAtGridPoint(focusPoint.x, focusPoint.y, this.subgrid, false);
            const editor = this._editor;
            if (editor !== undefined) {
                // Focus has an editor which either was hidden or needs its location changed
                if (cell === undefined) {
                    // editor became hidden
                    setTimeout(() => {
                        // defer to next tick
                        if (editor.setBounds !== undefined) {
                            // make editor hide itself
                            editor.setBounds(undefined);
                        }
                    }, 0);
                } else {
                    // editor probably changed position
                    setTimeout(() => {
                        // defer to next tick
                        if (editor.setBounds !== undefined) {
                            editor.setBounds(cell.bounds);
                        }
                    }, 0);
                }
            }

            this._cell = cell;
        }
    }

    /** @internal */
    private fireFocusChanged() {
        this.changedEventer(this._current, this._previous);
    }

    /** @internal */
    private tryOpenEditorAtFocusedCell(focusedCell: ViewCell<BCS, SF>, keyDownEvent: KeyboardEvent | undefined, clickEvent: MouseEvent | undefined) {
        if (this._editor !== undefined) {
            return true;
        } else {
            if (this.getCellEditorEventer === undefined || this.dataServer.getEditValue === undefined) {
                return false;
            } else {
                const focusedPoint = this._current;
                if (focusedPoint === undefined) {
                    throw new AssertError('FTOE17778');
                } else {
                    const column = this._columnsManager.getActiveColumn(focusedPoint.x);
                    const field = column.field;
                    const subgridRowIndex = focusedPoint.y;
                    const readonly = this.dataServer.setEditValue === undefined;
                    const editor = this.getCellEditorEventer(field, subgridRowIndex, this.subgrid, readonly, focusedCell);
                    if (editor === undefined) {
                        return false;
                    } else {
                        editor.pullValueEventer = () => this.getFocusedEditValue();
                        if (!readonly) {
                            editor.pushValueEventer = (value) => this.setFocusedEditValue(value);
                        }
                        editor.keyDownEventer = (event) => this.editorKeyDownEventer(event);
                        editor.closedEventer = (value) => this.handleEditorClosed(value);
                        this._editor = editor;
                        if (!editor.tryOpen(focusedCell, keyDownEvent, clickEvent)) {
                            this.finaliseEditor(editor)
                            this._editor = undefined;
                            return false;
                        } else {
                            if (editor.setBounds !== undefined) {
                                editor.setBounds(focusedCell.bounds);
                            } else {
                                this.viewCellRenderInvalidatedEventer(focusedCell);
                            }

                            return true;
                        }
                    }
                }
            }
        }
    }

    /** @internal */
    private finaliseEditor(editor: CellEditor<BCS, SF>) {
        editor.pullValueEventer = undefined;
        editor.pushValueEventer = undefined;
        editor.keyDownEventer = undefined;
        editor.closedEventer = undefined;
    }

    /** @internal */
    private getFocusedEditValue() {
        const focusedPoint = this._current;
        if (focusedPoint === undefined || this.dataServer.getEditValue === undefined) {
            throw new AssertError('FGFDV17778');
        } else {
            const column = this._columnsManager.getActiveColumn(focusedPoint.x);
            return this.dataServer.getEditValue(column.field, focusedPoint.y);
        }
    }

    /** @internal */
    private setFocusedEditValue(value: DataServer.ViewValue) {
        const focusedPoint = this._current;
        if (focusedPoint === undefined) {
            throw new AssertError('FGFDVF17778');
        } else {
            if (this.dataServer.setEditValue === undefined) {
                throw new AssertError('FGFDVS17778');
            } else {
                const column = this._columnsManager.getActiveColumn(focusedPoint.x);
                return this.dataServer.setEditValue(column.field, focusedPoint.y, value);
            }
        }
    }

    /** @internal */
    private closeFocus() {
        // in future, there may be scenarios where focus is not transferred to canvas if editor is closed
        this.closeEditor(false, true);

        const cell = this._cell;
        if (cell !== undefined) {
            this.viewCellRenderInvalidatedEventer(cell);
        }
        this._cell = undefined;
    }

    /** @internal */
    private createStashPoint(point: Point): Focus.Stash.Point | undefined {
        const dataServer = this._mainSubgrid.dataServer;
        if (dataServer.getRowIdFromIndex === undefined) {
            return undefined;
        } else {
            return {
                fieldName: this._columnsManager.getActiveColumn(point.x).field.name,
                rowId: dataServer.getRowIdFromIndex(point.y),
            };
        }
    }

    /** @internal */
    private createPointFromStash(stashPoint: Focus.Stash.Point): Point | undefined {
        const { fieldName, rowId: stashedRowId } = stashPoint;
        const activeColumnIndex = this._columnsManager.getActiveColumnIndexByFieldName(fieldName);
        if (activeColumnIndex < 0) {
            return undefined;
        } else {
            const dataServer = this._mainSubgrid.dataServer;
            if (dataServer.getRowIndexFromId !== undefined) {
                const rowIndex = dataServer.getRowIndexFromId(stashedRowId);
                if (rowIndex === undefined) {
                    throw new AssertError('FCPFSI50884'); // reindex should not lose row
                } else {
                    return {
                        x: activeColumnIndex,
                        y: rowIndex,
                    };
                }
            } else {
                if (dataServer.getRowIdFromIndex !== undefined) {
                    const rowCount = this._mainSubgrid.getRowCount();
                    for (let rowIndex = 0; rowIndex < rowCount; ++rowIndex) {
                        const rowId = dataServer.getRowIdFromIndex(rowIndex);
                        if (rowId === stashedRowId) {
                            return {
                                x: activeColumnIndex,
                                y: rowIndex,
                            };
                        }
                    }
                    throw new AssertError('FCPFSL50884'); // reindex should not lose row
                } else {
                    return undefined;
                }
            }
        }
    }
}

/** @public */
export namespace Focus {
    export type EditorKeyDownEventer = (this: void, event: KeyboardEvent) => void;
    export type GetCellEditorEventer<BCS extends BehavioredColumnSettings, SF extends SchemaField<BCS>> = (
        this: void,
        field: SF,
        subgridRowIndex: number,
        subgrid: Subgrid<BCS, SF>,
        readonly: boolean,
        cell: ViewCell<BCS, SF> | undefined
    ) => CellEditor<BCS, SF> | undefined;

    /** @internal */
    export type ChangedEventer = (this: void, newPoint: Point | undefined, oldPoint: Point | undefined) => void;
    /** @internal */
    export type ViewCellRenderInvalidatedEventer<BCS extends BehavioredColumnSettings, SF extends SchemaField<BCS>> = (this: void, cell: ViewCell<BCS, SF>) => void;

    export const enum ActionKeyboardKey {
        Tab = 'Tab',
        Escape = 'Escape',
        Enter = 'Enter',
        ArrowLeft = 'ArrowLeft',
        ArrowRight = 'ArrowRight',
        ArrowUp = 'ArrowUp',
        ArrowDown = 'ArrowDown',
        PageUp = 'PageUp',
        PageDown = 'PageDown',
        Home = 'Home',
        End = 'End',
    }

    export function isNavActionKeyboardKey(key: string) {
        const actionKey = key as ActionKeyboardKey;
        switch (actionKey) {
            case ActionKeyboardKey.Escape:
            case ActionKeyboardKey.Enter:
                return false;
            case ActionKeyboardKey.Tab:
            case ActionKeyboardKey.ArrowLeft:
            case ActionKeyboardKey.ArrowRight:
            case ActionKeyboardKey.ArrowUp:
            case ActionKeyboardKey.ArrowDown:
            case ActionKeyboardKey.PageUp:
            case ActionKeyboardKey.PageDown:
            case ActionKeyboardKey.Home:
            case ActionKeyboardKey.End:
                return true;
            default:
                actionKey satisfies never;
                return false;
        }
    }

    /** @internal */
    export interface Stash {
        readonly current: Stash.Point | undefined;
        readonly previous: Stash.Point | undefined;
    }

    /** @internal */
    export namespace Stash {
        export interface Point {
            readonly fieldName: string;
            readonly rowId: unknown;
        }
    }
}
