import { RevAssertError, RevClientObject, RevDataServer, RevPartialPoint, RevPoint, RevSchemaField, RevWritablePoint } from '../../../common';
import { RevCellEditor, RevMainSubgrid, RevSubgrid, RevViewCell } from '../../interfaces';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevGridSettings } from '../../settings';
import { RevCanvas } from '../canvas/canvas';
import { RevColumnsManager } from '../column/columns-manager';
import { RevViewLayout } from '../view/view-layout';

/** @public */
/**
 * Manages the focus state within a grid, including the currently focused cell, row, and column,
 * as well as the cell editor lifecycle and related events. Handles navigation, editing, and
 * synchronization of focus with grid changes such as row/column insertion, deletion, and movement.
 *
 * @typeParam BGS - Behaviored grid settings type.
 * @typeParam BCS - Behaviored column settings type.
 * @typeParam SF - Schema field type.
 *
 * @see [Focus Component Documentation](../../../../../Architecture/Client/Components/Focus/)
 */
export class RevFocus<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevClientObject {
    getCellEditorEventer: RevFocus.GetCellEditorEventer<BCS, SF> | undefined;
    editorKeyDownEventer: RevFocus.EditorKeyDownEventer;

    /** @internal */
    currentCellChangedForSelectionEventer: RevFocus.CurrentCellChangedForSelectionEventer;
    /** @internal */
    currentCellChangedForEventBehaviorEventer: RevFocus.CurrentCellChangedForEventBehaviorEventer;
    /** @internal */
    currentRowChangedForEventBehaviorEventer: RevFocus.CurrentRowChangedForEventBehaviorEventer;
    /** @internal */
    viewCellRenderInvalidatedEventer: RevFocus.ViewCellRenderInvalidatedEventer<BCS, SF>;

    /** @internal */
    private _current: RevFocus.Point<BCS, SF> | undefined;
    /** @internal */
    private _previous: RevFocus.Point<BCS, SF> | undefined;

    // Optionally track position in canvas where focus is.  Used to assist with paging
    /** @internal */
    private _canvasX: number | undefined;
    /** @internal */
    private _canvasY: number | undefined;

    /** @internal */
    private _editor: RevCellEditor<BCS, SF> | undefined;
    /** @internal */
    private _editorPoint: RevFocus.Point<BCS, SF> | undefined;
    // private _editorActiveColumnIndex: number | undefined;
    // /** @internal */
    // private _editorSubgridRowIndex: number | undefined;
    /** @internal */
    private _cell: RevViewCell<BCS, SF> | undefined;

    /** @internal */
    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        /** @internal */
        private readonly _gridSettings: RevGridSettings,
        /** @internal */
        private readonly _canvas: RevCanvas<BGS>,
        /** @internal */
        private readonly _mainSubgrid: RevMainSubgrid<BCS, SF>,
        /** @internal */
        private readonly _columnsManager: RevColumnsManager<BCS, SF>,
        /** @internal */
        private readonly _viewLayout: RevViewLayout<BGS, BCS, SF>,
    ) {
        this._viewLayout.cellPoolComputedEventerForFocus = () => { this.handleCellPoolComputedEvent(); };
    }

    get currentActiveColumnIndex() { return this._current === undefined ? undefined : this._current.x; }
    get currentSubgridRowIndex() { return this._current === undefined ? undefined : this._current.y; }
    get currentSubgrid() { return this._current === undefined ? undefined : this._current.subgrid; }

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

    /**
     * Clears the current focus.
     *
     * The previous focus is set to the current focus before clearing it.
     * Listeners are notified if the current focus was changed.
     */
    clear(): void {
        this.closeFocus();
        const newPrevious = this._current;
        this._previous = newPrevious;
        this._current = undefined;
        if (newPrevious !== undefined) {
            this.notifyCurrentCellChanged();
            this.notifyCurrentRowChanged(undefined, undefined);
        }
    }

    trySetColumnRow(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>, cell: RevViewCell<BCS, SF> | undefined, canvasX: number | undefined, canvasY: number | undefined): boolean {
        if (this.isColumnFocusable(activeColumnIndex) && this.isRowFocusable(subgridRowIndex, subgrid)) {
            this.setColumnRow(activeColumnIndex, subgridRowIndex, subgrid, cell, canvasX, canvasY);
            return true;
        } else {
            return false;
        }
    }

    setColumnRowOrClear(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>, cell: RevViewCell<BCS, SF> | undefined, canvasX: number | undefined, canvasY: number | undefined): boolean {
        if (this.trySetColumnRow(activeColumnIndex, subgridRowIndex, subgrid, cell, canvasX, canvasY)) {
            return true;
        } else {
            this.clear();
            return false;
        }
    }

    trySetPoint(subgridPoint: RevPoint, subgrid: RevSubgrid<BCS, SF>, cell: RevViewCell<BCS, SF> | undefined, canvasPoint: RevPartialPoint | undefined): boolean {
        if (this.isPointFocusable(subgridPoint, subgrid)) {
            this.setPoint(subgridPoint, subgrid, cell, canvasPoint);
            return true;
        } else {
            return false;
        }
    }

    setPointOrClear(subgridPoint: RevPoint, subgrid: RevSubgrid<BCS, SF>, cell: RevViewCell<BCS, SF> | undefined, canvasPoint: RevPartialPoint | undefined): boolean {
        if (this.trySetPoint(subgridPoint, subgrid, cell, canvasPoint)) {
            return true;
        } else {
            this.clear();
            return false;
        }
    }

    trySetColumn(activeColumnIndex: number, cell: RevViewCell<BCS, SF> | undefined, canvasX: number | undefined): boolean {
        if (!this.isColumnFocusable(activeColumnIndex)) {
            return false;
        } else {
            const current = this._current;
            let subgrid: RevSubgrid<BCS, SF>;
            let subgridRowIndex: number;
            if (current !== undefined) {
                subgrid = current.subgrid;
                subgridRowIndex = current.y;
            } else {
                subgrid = this._mainSubgrid;
                subgridRowIndex = this._gridSettings.fixedRowCount;
                const subgridRowCount = subgrid.getRowCount();
                if (subgridRowIndex >= subgridRowCount) {
                    subgridRowIndex = subgridRowCount - 1;
                }
            }
            this.setColumn(activeColumnIndex, subgridRowIndex, subgrid, current, cell, canvasX);
            return true;
        }
    }

    setColumnOrClear(activeColumnIndex: number, cell: RevViewCell<BCS, SF> | undefined, canvasX: number | undefined): boolean {
        if (this.trySetColumn(activeColumnIndex, cell, canvasX)) {
            return true;
        } else {
            this.clear();
            return false;
        }
    }

    trySetRow(subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>, cell: RevViewCell<BCS, SF> | undefined, canvasY: number | undefined): boolean {
        if (!this.isRowFocusable(subgridRowIndex, subgrid)) {
            return false;
        } else {
            const current = this._current;
            let activeColumnIndex: number;
            if (current !== undefined) {
                activeColumnIndex = current.x;
            } else {
                activeColumnIndex = this._gridSettings.fixedColumnCount;
                if (activeColumnIndex >= this._columnsManager.activeColumnCount) {
                    activeColumnIndex = this._columnsManager.activeColumnCount - 1;
                }
            }
            this.setRow(activeColumnIndex, subgridRowIndex, subgrid, current, cell, canvasY);
            return true;
        }
    }

    setRowOrClear(subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>, cell: RevViewCell<BCS, SF> | undefined, canvasY: number | undefined): boolean {
        if (this.trySetRow(subgridRowIndex, subgrid, cell, canvasY)) {
            return true;
        } else {
            this.clear();
            return false;
        }
    }

    isPointFocusable(point: RevPoint, subgrid: RevSubgrid<BCS, SF>): boolean {
        return this.isColumnFocusable(point.x) && this.isRowFocusable(point.y, subgrid);
    }

    isColumnFocusable(activeColumnIndex: number): boolean {
        return activeColumnIndex >= this._gridSettings.fixedColumnCount && activeColumnIndex < this._columnsManager.activeColumnCount;
    }

    isRowFocusable(subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): boolean {
        return subgrid.focusable && subgridRowIndex >= this._gridSettings.fixedRowCount && subgridRowIndex < subgrid.getRowCount();
    }

    isColumnFocused(activeColumnIndex: number): boolean {
        const current = this._current;
        return current !== undefined && activeColumnIndex === current.x;
    }

    isRowFocused(subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): boolean {
        const current = this._current;
        if (current === undefined) {
            return false;
        } else {
            return subgrid === current.subgrid && subgridRowIndex === current.y;
        }
    }

    isMainRowFocused(mainSubgridRowIndex: number): boolean {
        return this.isRowFocused(mainSubgridRowIndex, this._mainSubgrid);
    }

    isCellFocused(cell: RevViewCell<BCS, SF>): boolean {
        return cell === this._cell;
    }

    isGridPointFocused(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): boolean {
        const current = this._current;
        return (
            current !== undefined &&
            activeColumnIndex === current.x &&
            subgridRowIndex === current.y &&
            subgrid === current.subgrid
        );
    }

    // isMainSubgridGridPointFocused(activeColumnIndex: number, mainSubgridRowIndex: number): boolean {
    //     return this.isGridPointFocused(activeColumnIndex, mainSubgridRowIndex, this._mainSubgrid);
    // }

    /**
     * Attempts to open the editor at the currently focused cell.
     *
     * For a successful operation, the focused cell must be visible and editable.
     *
     * @returns Returns `true` if the editor was successfully opened (including if it was already open), or `false` if there is open operation failed.
     */
    tryOpenEditor(): boolean {
        if (this._cell === undefined) {
            return false; // cannot open editor if focused cell is not visible
        } else {
            return this.tryOpenEditorAtFocusedViewCell(this._cell, undefined, undefined);
        }
    }

    /**
     * Closes the currently active editor, if one exists.
     */
    closeEditor(): void {
        if (this._editor !== undefined) {
            this.closeSpecifiedEditor(this._editor, false, true);
        }
    }

    canGetFocusedEditValue() {
        const current = this._current;
        return current !== undefined && current.subgrid.dataServer.getEditValue !== undefined
    }

    getFocusedEditValue() {
        const current = this._current;
        if (current === undefined) {
            throw new RevAssertError('FGFDV17778');
        } else {
            const current = this._current;
            if (current === undefined) {
                throw new RevAssertError('FGFDV17779');
            } else {
                const dataServer = current.subgrid.dataServer;

                if (dataServer.getEditValue === undefined) {
                    throw new RevAssertError('FGFDV17780');
                } else {
                    const column = this._columnsManager.getActiveColumn(current.x);
                    return dataServer.getEditValue(column.field, current.y);
                }
            }
        }
    }

    canSetFocusedEditValue() {
        const current = this._current;
        return current !== undefined && current.subgrid.dataServer.setEditValue !== undefined;
    }

    setFocusedEditValue(value: RevDataServer.ViewValue) {
        const current = this._current;
        if (current === undefined) {
            throw new RevAssertError('FGFDVF17778');
        } else {
            const dataServer = current.subgrid.dataServer;
            if (dataServer.setEditValue === undefined) {
                throw new RevAssertError('FGFDVS17778');
            } else {
                const column = this._columnsManager.getActiveColumn(current.x);
                dataServer.setEditValue(column.field, current.y, value);
                return;
            }
        }
    }

    /** @internal */
    tryOpenEditorAtViewCell(cell: RevViewCell<BCS, SF>): boolean {
        if (cell !== this._cell) {
            // Can only open editor at Focused cell
            throw new RevAssertError('FTOE34349');
        } else {
            return this.tryOpenEditorAtFocusedViewCell(cell, undefined, undefined)
        }
    }

    /** @internal */
    checkEditorWantsKeyDownEvent(event: KeyboardEvent, fromEditor: boolean): boolean {
        const editor = this._editor;
        if (editor === undefined) {
            const cell = this._cell;
            if (cell === undefined) {
                return false; // cannot open editor if focused cell is not visible
            } else {
                const key = event.key;
                if (key === this._gridSettings.editKey) {
                    return this.tryOpenEditorAtFocusedViewCell(cell, undefined, undefined);
                } else {
                    if (cell.columnSettings.editOnKeyDown) {
                        return this.tryOpenEditorAtFocusedViewCell(cell, event, undefined);
                    } else {
                        return false;
                    }
                }
            }
        } else {
            const key = event.key as RevFocus.ActionKeyboardKey;
            const current = this._current;
            if (current === undefined) {
                throw new RevAssertError('FCEWKDE98887');
            } else {
                const column = this._columnsManager.getActiveColumn(current.x);
                const subgridRowIndex = current.y;
                const consumed = editor.processGridKeyDownEvent(event, fromEditor, column.field, subgridRowIndex);
                if (consumed) {
                    return true;
                } else {
                    switch (key) {
                        case RevFocus.ActionKeyboardKey.enter: {
                            this.closeSpecifiedEditor(editor, false, true);
                            return true;
                        }
                        case RevFocus.ActionKeyboardKey.escape: {
                            this.closeSpecifiedEditor(editor, true, true);
                            return true;
                        }
                        default:
                            return false;
                    }
                }
            }
        }
    }

    /** @internal */
    checkEditorWantsClickEvent(event: MouseEvent, focusedCell: RevViewCell<BCS, SF>): boolean {
        if (focusedCell !== this._cell) {
            throw new RevAssertError('FCEWCE59572');
        } else {
            const editor = this._editor;
            if (editor === undefined) {
                if (!focusedCell.columnSettings.editOnClick) {
                    return false;
                } else {
                    return this.tryOpenEditorAtFocusedViewCell(focusedCell, undefined, event);
                }
            } else {
                if (editor.processGridClickEvent === undefined) {
                    return false;
                } else {
                    return editor.processGridClickEvent(event, focusedCell);
                }
            }
        }
    }

    /** @internal */
    checkEditorProcessPointerMoveEvent(event: PointerEvent, focusedCell: RevViewCell<BCS, SF>): RevCellEditor.MouseActionPossible | undefined {
        if (focusedCell !== this._cell) {
            throw new RevAssertError('FCEWCE59572');
        } else {
            const editor = this._editor;
            if (editor === undefined) {
                return undefined;
            } else {
                if (editor.processGridPointerMoveEvent === undefined) {
                    return undefined;
                } else {
                    return editor.processGridPointerMoveEvent(event, focusedCell);
                }
            }
        }
    }

    /** @internal */
    adjustForRowsInserted(rowIndex: number, rowCount: number, dataServer: RevDataServer<SF>) {
        const current = this._current;
        if (current !== undefined && dataServer === current.subgrid.dataServer) {
            RevWritablePoint.adjustForYRangeInserted(current, rowIndex, rowCount);
            this._canvasY = undefined;
        }
        const previous = this._previous;
        if (previous !== undefined && dataServer === previous.subgrid.dataServer) {
            RevWritablePoint.adjustForYRangeInserted(previous, rowIndex, rowCount);
        }

        const editorPoint = this._editorPoint;
        if (editorPoint !== undefined && dataServer === editorPoint.subgrid.dataServer) {
            RevWritablePoint.adjustForYRangeInserted(editorPoint, rowIndex, rowCount);
        }
    }

    /** @internal */
    adjustForRowsDeleted(rowIndex: number, rowCount: number, dataServer: RevDataServer<SF>) {
        const current = this._current;
        if (current !== undefined && dataServer === current.subgrid.dataServer) {
            const positionInDeletionRange = RevWritablePoint.adjustForYRangeDeleted(current, rowIndex, rowCount);
            if (positionInDeletionRange !== undefined) {
                this._current = undefined;
            }
            this._canvasY = undefined;
        }

        const previous = this._previous;
        if (previous !== undefined && dataServer === previous.subgrid.dataServer) {
            const positionInDeletionRange = RevWritablePoint.adjustForYRangeDeleted(previous, rowIndex, rowCount);
            if (positionInDeletionRange !== undefined) {
                this._previous = undefined;
            }
        }

        const editorPoint = this._editorPoint;
        if (editorPoint !== undefined && dataServer === editorPoint.subgrid.dataServer) {
            const positionInDeletionRange = RevWritablePoint.adjustForYRangeDeleted(editorPoint, rowIndex, rowCount);
            if (positionInDeletionRange && this._editor !== undefined) {
                this.closeSpecifiedEditor(this._editor, true, true)
            }
        }
    }

    /** @internal */
    adjustForRowsMoved(oldRowIndex: number, newRowIndex: number, count: number, dataServer: RevDataServer<SF>) {
        const current = this._current;
        if (current !== undefined && dataServer === current.subgrid.dataServer) {
            RevWritablePoint.adjustForYRangeMoved(current, oldRowIndex, newRowIndex, count);
            this._canvasY = undefined;
        }

        const previous = this._previous;
        if (previous !== undefined && dataServer === previous.subgrid.dataServer) {
            RevWritablePoint.adjustForYRangeMoved(previous, oldRowIndex, newRowIndex, count);
        }

        const editorPoint = this._editorPoint;
        if (editorPoint !== undefined && dataServer === editorPoint.subgrid.dataServer) {
            RevWritablePoint.adjustForYRangeMoved(editorPoint, oldRowIndex, newRowIndex, count);
        }
    }

    /** @internal */
    adjustForColumnsInserted(columnIndex: number, columnCount: number) {
        const current = this._current;
        if (current !== undefined) {
            RevWritablePoint.adjustForXRangeInserted(current, columnIndex, columnCount);
            this._canvasX = undefined;
        }

        const previous = this._previous;
        if (previous !== undefined) {
            RevWritablePoint.adjustForXRangeInserted(previous, columnIndex, columnCount);
        }

        const editorPoint = this._editorPoint;
        if (editorPoint !== undefined) {
            RevWritablePoint.adjustForXRangeInserted(editorPoint, columnIndex, columnCount);
        }
    }

    /** @internal */
    adjustForActiveColumnsDeleted(columnIndex: number, columnCount: number) {
        const current = this._current;
        if (current !== undefined) {
            const positionInDeletionRange = RevWritablePoint.adjustForXRangeDeleted(current, columnIndex, columnCount);
            if (positionInDeletionRange !== undefined) {
                this._current = undefined;
            }
            this._canvasX = undefined;
        }

        const previous = this._previous;
        if (previous !== undefined) {
            const positionInDeletionRange = RevWritablePoint.adjustForXRangeDeleted(previous, columnIndex, columnCount);
            if (positionInDeletionRange !== undefined) {
                this._previous = undefined;
            }
        }

        const editorPoint = this._editorPoint;
        if (editorPoint !== undefined) {
            const positionInDeletionRange = RevWritablePoint.adjustForXRangeDeleted(editorPoint, columnIndex, columnCount);
            if (positionInDeletionRange && this._editor !== undefined) {
                this.closeSpecifiedEditor(this._editor, true, true);
            }
        }
    }

    /** @internal */
    adjustForColumnsMoved(oldColumnIndex: number, newColumnIndex: number, count: number) {
        const current = this._current;
        if (current !== undefined) {
            RevWritablePoint.adjustForXRangeMoved(current, oldColumnIndex, newColumnIndex, count);
            this._canvasX = undefined;
        }

        const previous = this._previous;
        if (previous !== undefined) {
            RevWritablePoint.adjustForXRangeMoved(previous, oldColumnIndex, newColumnIndex, count);
        }

        const editorPoint = this._editorPoint;
        if (editorPoint !== undefined) {
            RevWritablePoint.adjustForXRangeMoved(editorPoint, oldColumnIndex, newColumnIndex, count);
        }
    }

    /** @internal */
    invalidateSubgrid(subgrid: RevSubgrid<BCS, SF>) {
        const editorPoint = this._editorPoint;
        if (editorPoint !== undefined && subgrid === editorPoint.subgrid) {
            // Editor is open in this subgrid, so invalidate it
            if (this._editor !== undefined && this._editor.invalidateValue !== undefined) {
                this._editor.invalidateValue();
            }
        }
    }

    /** @internal */
    invalidateSubgridRows(subgrid: RevSubgrid<BCS, SF>, subgridRowIndex: number, count: number) {
        const editorPoint = this._editorPoint;
        if (editorPoint !== undefined && subgrid === editorPoint.subgrid) {
            if (this._editor !== undefined && this._editor.invalidateValue !== undefined) {
                const editorSubgridRowIndex = editorPoint.y;
                if (editorSubgridRowIndex >= subgridRowIndex && editorSubgridRowIndex < (subgridRowIndex + count)) {
                    this._editor.invalidateValue();
                }
            }
        }
    }

    /** @internal */
    invalidateSubgridRow(subgrid: RevSubgrid<BCS, SF>, subgridRowIndex: number) {
        const editorPoint = this._editorPoint;
        if (editorPoint !== undefined && subgrid === editorPoint.subgrid) {
            if (this._editor !== undefined && this._editor.invalidateValue !== undefined) {
                const editorSubgridRowIndex = editorPoint.y;
                if (subgridRowIndex === editorSubgridRowIndex) {
                    this._editor.invalidateValue();
                }
            }
        }
    }

    /** @internal */
    invalidateSubgridRowCells(subgrid: RevSubgrid<BCS, SF>, subgridRowIndex: number, activeColumnIndices: number[]) {
        const editorPoint = this._editorPoint;
        if (editorPoint !== undefined && subgrid === editorPoint.subgrid) {
            if (this._editor !== undefined && this._editor.invalidateValue !== undefined) {
                const editorSubgridRowIndex = editorPoint.y;
                if (editorSubgridRowIndex === undefined) {
                    throw new RevAssertError('FISCS40199');
                } else {
                    if (subgridRowIndex === editorSubgridRowIndex) {
                        const editorActiveColumnIndex = editorPoint.x;
                        if (editorActiveColumnIndex === undefined) {
                            throw new RevAssertError('FISCS40199');
                        } else {
                            for (const activeColumnIndex of activeColumnIndices) {
                                if (activeColumnIndex === editorActiveColumnIndex) {
                                    this._editor.invalidateValue();
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /** @internal */
    invalidateSubgridCell(subgrid: RevSubgrid<BCS, SF>, activeColumnIndex: number, subgridRowIndex: number) {
        const editorPoint = this._editorPoint;
        if (editorPoint !== undefined && subgrid === editorPoint.subgrid) {
            if (this._editor !== undefined && this._editor.invalidateValue !== undefined) {
                const editorActiveColumnIndex = editorPoint.x;
                const editorSubgridRowIndex = editorPoint.y;
                if (editorSubgridRowIndex === undefined || editorActiveColumnIndex === undefined) {
                    throw new RevAssertError('FISC40199');
                } else {
                    if (subgridRowIndex === editorSubgridRowIndex && activeColumnIndex === editorActiveColumnIndex) {
                        this._editor.invalidateValue();
                    }
                }
            }
        }
    }

    /** @internal */
    createStash(): RevFocus.Stash<BCS, SF> {
        let currentStashPoint: RevFocus.Stash.Point<BCS, SF> | undefined;
        if (this._current !== undefined) {
            currentStashPoint = this.createStashPoint(this._current);
        }
        let previousStashPoint: RevFocus.Stash.Point<BCS, SF> | undefined;
        if (this._previous !== undefined) {
            previousStashPoint = this.createStashPoint(this._previous);
        }

        return {
            current: currentStashPoint,
            previous: previousStashPoint,
        }
    }

    /** @internal */
    restoreStash(stash: RevFocus.Stash<BCS, SF>, allRowsKept: boolean) {
        this.closeFocus();

        if (stash.current === undefined) {
            this._current = undefined;
        } else {
            this._current = this.createPointFromStash(stash.current, allRowsKept);
        }

        if (stash.previous === undefined) {
            this._previous = undefined;
        } else {
            this._previous = this.createPointFromStash(stash.previous, allRowsKept);
        }
    }

    /** @internal */
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    private handleEditorClosed(value: RevDataServer.ViewValue | undefined) {
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
            const cell = this._viewLayout.findCellAtGridPoint(focusPoint.x, focusPoint.y, focusPoint.subgrid, false);
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
    private notifyCurrentCellChanged() {
        this.currentCellChangedForEventBehaviorEventer(this._current, this._previous);
        this.currentCellChangedForSelectionEventer();
    }

    /** @internal */
    private notifyCurrentRowChanged(newSubgridRowIndex: number | undefined, oldSubgridRowIndex: number | undefined) {
        this.currentRowChangedForEventBehaviorEventer(newSubgridRowIndex, oldSubgridRowIndex);
    }

    /** @internal */
    private setPoint(subgridPoint: RevPoint, subgrid: RevSubgrid<BCS, SF>, cell: RevViewCell<BCS, SF> | undefined, canvasPoint: RevPartialPoint | undefined): void {
        const newCurrentActiveColumnIndex = subgridPoint.x;
        const newCurrentSubgridRowIndex = subgridPoint.y;
        const newPrevious = this._current;
        const newPreviousDefined = newPrevious !== undefined;
        const newPreviousActiveColumnIndex = newPreviousDefined ? newPrevious.x : undefined;
        const activeColumnIndexChanged = newPreviousActiveColumnIndex !== newCurrentActiveColumnIndex;
        const newPreviousSubgridRowIndex = newPreviousDefined ? newPrevious.y : undefined;
        const subgridRowIndexChanged = newPreviousSubgridRowIndex !== newCurrentSubgridRowIndex;
        if (activeColumnIndexChanged || subgridRowIndexChanged) {
            this.closeFocus();
            this._previous = newPrevious;
            this._current = {
                x: subgridPoint.x,
                y: subgridPoint.y,
                subgrid,
            };

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
                cell = this._viewLayout.findCellAtGridPoint(newCurrentActiveColumnIndex, newCurrentSubgridRowIndex, subgrid, true);
            }

            if (cell !== undefined) {
                this._cell = cell;

                if (cell.viewLayoutColumn.column.settings.editOnFocusCell) {
                    this.tryOpenEditorAtFocusedViewCell(cell, undefined, undefined);
                }

                this.viewCellRenderInvalidatedEventer(cell);
            }

            this.notifyCurrentCellChanged();
            if (subgridRowIndexChanged) {
                this.notifyCurrentRowChanged(newCurrentSubgridRowIndex, newPreviousSubgridRowIndex);
            }
        }
    }

    /** @internal */
    private setColumnRow(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>, cell: RevViewCell<BCS, SF> | undefined, canvasX: number | undefined, canvasY: number | undefined): void {
        const newPrevious = this._current;
        const newPreviousDefined = newPrevious !== undefined;
        const newPreviousActiveColumnIndex = newPreviousDefined ? newPrevious.x : undefined;
        const activeColumnIndexChanged = activeColumnIndex !== newPreviousActiveColumnIndex;
        const newPreviousSubgridRowIndex = newPreviousDefined ? newPrevious.y : undefined;
        const subgridRowIndexChanged = subgridRowIndex !== newPreviousSubgridRowIndex;
        if (activeColumnIndexChanged || subgridRowIndexChanged) {
            this.closeFocus();
            this._previous = newPrevious;
            this._current = {
                x: activeColumnIndex,
                y: subgridRowIndex,
                subgrid,
            };

            if (canvasX !== undefined) {
                this._canvasX = canvasX;
            }
            if (canvasY !== undefined) {
                this._canvasY = canvasY;
            }

            if (cell === undefined) {
                cell = this._viewLayout.findCellAtGridPoint(activeColumnIndex, subgridRowIndex, subgrid, true);
            }

            if (cell !== undefined) {
                this._cell = cell;

                if (cell.viewLayoutColumn.column.settings.editOnFocusCell) {
                    this.tryOpenEditorAtFocusedViewCell(cell, undefined, undefined);
                }

                this.viewCellRenderInvalidatedEventer(cell);
            }

            this.notifyCurrentCellChanged();
            if (subgridRowIndexChanged) {
                this.notifyCurrentRowChanged(subgridRowIndex, newPreviousSubgridRowIndex);
            }
        }
    }

    /** @internal */
    private setColumn(
        activeColumnIndex: number,
        subgridRowIndex: number,
        subgrid: RevSubgrid<BCS, SF>,
        oldCurrent: RevFocus.Point<BCS, SF> | undefined,
        cell: RevViewCell<BCS, SF> | undefined,
        canvasX: number | undefined
    ): void {
        if (oldCurrent === undefined || activeColumnIndex !== oldCurrent.x) {
            if (oldCurrent !== undefined) {
                this.closeFocus();
            }
            this._previous = oldCurrent;

            this._current = {
                x: activeColumnIndex,
                y: subgridRowIndex,
                subgrid,
            };

            if (canvasX !== undefined) {
                this._canvasX = canvasX;
            }

            if (cell === undefined) {
                cell = this._viewLayout.findCellAtGridPoint(activeColumnIndex, subgridRowIndex, subgrid, true);
            }

            if (cell !== undefined) {
                this._cell = cell;

                if (cell.viewLayoutColumn.column.settings.editOnFocusCell) {
                    this.tryOpenEditorAtFocusedViewCell(cell, undefined, undefined);
                }

                this.viewCellRenderInvalidatedEventer(cell);
            }

            this.notifyCurrentCellChanged();
        }
    }

    /** @internal */
    private setRow(
        activeColumnIndex: number,
        subgridRowIndex: number,
        subgrid: RevSubgrid<BCS, SF>,
        oldCurrent: RevFocus.Point<BCS, SF> | undefined,
        cell: RevViewCell<BCS, SF> | undefined,
        canvasY: number | undefined
    ): void {
        if (oldCurrent === undefined || subgridRowIndex !== oldCurrent.y || subgrid !== oldCurrent.subgrid) {
            if (oldCurrent !== undefined) {
                this.closeFocus();
            }
            this._previous = oldCurrent;

            this._current = {
                x: activeColumnIndex,
                y: subgridRowIndex,
                subgrid,
            };

            if (canvasY !== undefined) {
                this._canvasY = canvasY;
            }

            if (cell === undefined) {
                cell = this._viewLayout.findCellAtGridPoint(activeColumnIndex, subgridRowIndex, subgrid, true);
            }

            if (cell !== undefined) {
                this._cell = cell;

                if (cell.viewLayoutColumn.column.settings.editOnFocusCell) {
                    this.tryOpenEditorAtFocusedViewCell(cell, undefined, undefined);
                }

                this.viewCellRenderInvalidatedEventer(cell);
            }

            this.notifyCurrentCellChanged();
            this.notifyCurrentRowChanged(subgridRowIndex, oldCurrent === undefined ? undefined : oldCurrent.y);
        }
    }

    /** @internal */
    private tryOpenEditorAtFocusedViewCell(focusedCell: RevViewCell<BCS, SF>, keyDownEvent: KeyboardEvent | undefined, clickEvent: MouseEvent | undefined) {
        if (this._editor !== undefined) {
            return true;
        } else {
            if (this.getCellEditorEventer === undefined) {
                return false;
            } else {
                const current = this._current;
                if (current === undefined) {
                    throw new RevAssertError('FTOEAFVC12313');
                } else {
                    const dataServer = current.subgrid.dataServer;
                    if (dataServer.getEditValue === undefined) {
                        return false;
                    } else {
                        const current = this._current;
                        if (current === undefined) {
                            throw new RevAssertError('FTOE17778');
                        } else {
                            const column = this._columnsManager.getActiveColumn(current.x);
                            const field = column.field;
                            const subgridRowIndex = current.y;
                            const subgrid = current.subgrid;
                            const readonly = dataServer.setEditValue === undefined;
                            const editor = this.getCellEditorEventer(field, subgridRowIndex, subgrid, readonly, focusedCell);
                            if (editor === undefined) {
                                return false;
                            } else {
                                editor.pullCellValueEventer = () => this.getFocusedEditValue();
                                if (!readonly) {
                                    editor.pushCellValueEventer = (value) => { this.setFocusedEditValue(value); };
                                }
                                editor.keyDownEventer = (event) => { this.editorKeyDownEventer(event); };
                                editor.cellClosedEventer = (value) => { this.handleEditorClosed(value); };
                                this._editor = editor;
                                if (!editor.tryOpenCell(focusedCell, keyDownEvent, clickEvent)) {
                                    this.finaliseEditor(editor)
                                    this._editor = undefined;
                                    return false;
                                } else {
                                    this._editorPoint = {
                                        x: current.x,
                                        y: subgridRowIndex,
                                        subgrid,
                                    }

                                    if (editor.setBounds !== undefined) {
                                        editor.setBounds(focusedCell.bounds);
                                        if (editor.focus !== undefined) {
                                            editor.focus();
                                        }
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
        }
    }

    /** @internal */
    private finaliseEditor(editor: RevCellEditor<BCS, SF>) {
        editor.pullCellValueEventer = undefined;
        editor.pushCellValueEventer = undefined;
        editor.keyDownEventer = undefined;
        editor.cellClosedEventer = undefined;
        if (editor.setBounds !== undefined) {
            editor.setBounds(undefined);
        }
    }

    /** @internal */
    private closeFocus() {
        // in future, there may be scenarios where focus is not transferred to canvas if editor is closed
        if (this._editor !== undefined) {
            this.closeSpecifiedEditor(this._editor, true, true)
        }

        const cell = this._cell;
        if (cell !== undefined) {
            this.viewCellRenderInvalidatedEventer(cell);
        }
        this._cell = undefined;
    }

    /** @internal */
    private closeSpecifiedEditor(editor: RevCellEditor<BCS, SF>, cancel: boolean, focusCanvas: boolean) {
        const editorPoint = this._editorPoint;
        if (editorPoint === undefined) {
            throw new RevAssertError('FCSE40199');
        } else {
            this._editor = undefined;
            const activeColumnIndex = editorPoint.x;
            const subgridRowIndex = editorPoint.y;
            this._editorPoint = undefined;
            const column = this._columnsManager.getActiveColumn(activeColumnIndex);
            editor.closeCell(column.field, subgridRowIndex, cancel);
            this.finaliseEditor(editor);

            if (this._cell !== undefined) {
                this.viewCellRenderInvalidatedEventer(this._cell);
            }

            if (focusCanvas) {
                this._canvas.element.focus();
            }
        }
    }

    /** @internal */
    private createStashPoint(point: RevFocus.Point<BCS, SF>): RevFocus.Stash.Point<BCS, SF> | undefined {
        const subgrid = point.subgrid;
        const dataServer = subgrid.dataServer;
        if (dataServer.getRowIdFromIndex === undefined) {
            return undefined;
        } else {
            return {
                fieldName: this._columnsManager.getActiveColumn(point.x).field.name,
                rowId: dataServer.getRowIdFromIndex(point.y),
                subgrid,
            };
        }
    }

    /** @internal */
    private createPointFromStash(stashPoint: RevFocus.Stash.Point<BCS, SF>, allRowsKept: boolean): RevFocus.Point<BCS, SF> | undefined {
        const { fieldName, rowId: stashedRowId, subgrid } = stashPoint;
        const activeColumnIndex = this._columnsManager.getActiveColumnIndexByFieldName(fieldName);
        if (activeColumnIndex < 0) {
            return undefined;
        } else {
            const dataServer = subgrid.dataServer;
            if (dataServer.getRowIndexFromId !== undefined) {
                const rowIndex = dataServer.getRowIndexFromId(stashedRowId);
                if (rowIndex === undefined) {
                    if (allRowsKept) {
                        throw new RevAssertError('FCPFSI50884');
                    } else {
                        return undefined;
                    }
                } else {
                    return {
                        x: activeColumnIndex,
                        y: rowIndex,
                        subgrid,
                    };
                }
            } else {
                if (dataServer.getRowIdFromIndex !== undefined) {
                    const rowCount = subgrid.getRowCount();
                    for (let rowIndex = 0; rowIndex < rowCount; ++rowIndex) {
                        const rowId = dataServer.getRowIdFromIndex(rowIndex);
                        if (rowId === stashedRowId) {
                            return {
                                x: activeColumnIndex,
                                y: rowIndex,
                                subgrid,
                            };
                        }
                    }
                    if (allRowsKept) {
                        throw new RevAssertError('FCPFSL50884');
                    } else {
                        return undefined;
                    }
                } else {
                    return undefined;
                }
            }
        }
    }
}

/** @public */
export namespace RevFocus {
    export interface Point<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevWritablePoint {
        readonly subgrid: RevSubgrid<BCS, SF>;
    }
    export type EditorKeyDownEventer = (this: void, event: KeyboardEvent) => void;
    export type GetCellEditorEventer<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = (
        this: void,
        field: SF,
        subgridRowIndex: number,
        subgrid: RevSubgrid<BCS, SF>,
        readonly: boolean,
        cell: RevViewCell<BCS, SF> | undefined
    ) => RevCellEditor<BCS, SF> | undefined;

    /** @internal */
    export type CurrentCellChangedForSelectionEventer = (this: void) => void;
    /** @internal */
    export type CurrentCellChangedForEventBehaviorEventer = (this: void, newPoint: RevPoint | undefined, oldPoint: RevPoint | undefined) => void;
    /** @internal */
    export type CurrentRowChangedForEventBehaviorEventer = (this: void, newSubgridRowIndex: number | undefined, oldSubgridRowIndex: number | undefined) => void;
    /** @internal */
    export type ViewCellRenderInvalidatedEventer<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = (this: void, cell: RevViewCell<BCS, SF>) => void;

    export type ActionKeyboardKey =
        typeof ActionKeyboardKey.tab |
        typeof ActionKeyboardKey.escape |
        typeof ActionKeyboardKey.enter |
        typeof ActionKeyboardKey.arrowLeft |
        typeof ActionKeyboardKey.arrowRight |
        typeof ActionKeyboardKey.arrowUp |
        typeof ActionKeyboardKey.arrowDown |
        typeof ActionKeyboardKey.pageUp |
        typeof ActionKeyboardKey.pageDown |
        typeof ActionKeyboardKey.home |
        typeof ActionKeyboardKey.end;

    export namespace ActionKeyboardKey {
        export const tab = 'Tab';
        export const escape = 'Escape';
        export const enter = 'Enter';
        export const arrowLeft = 'ArrowLeft';
        export const arrowRight = 'ArrowRight';
        export const arrowUp = 'ArrowUp';
        export const arrowDown = 'ArrowDown';
        export const pageUp = 'PageUp';
        export const pageDown = 'PageDown';
        export const home = 'Home';
        export const end = 'End';
    }

    export function isNavActionKeyboardKey(key: ActionKeyboardKey) {
        switch (key) {
            case ActionKeyboardKey.escape:
            case ActionKeyboardKey.enter:
                return false;
            case ActionKeyboardKey.tab:
            case ActionKeyboardKey.arrowLeft:
            case ActionKeyboardKey.arrowRight:
            case ActionKeyboardKey.arrowUp:
            case ActionKeyboardKey.arrowDown:
            case ActionKeyboardKey.pageUp:
            case ActionKeyboardKey.pageDown:
            case ActionKeyboardKey.home:
            case ActionKeyboardKey.end:
                return true;
            default:
                key satisfies never;
                return false;
        }
    }

    /** @internal */
    export interface Stash<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
        readonly current: Stash.Point<BCS, SF> | undefined;
        readonly previous: Stash.Point<BCS, SF> | undefined;
    }

    /** @internal */
    export namespace Stash {
        export interface Point<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
            readonly fieldName: string;
            readonly rowId: unknown;
            readonly subgrid: RevSubgrid<BCS, SF>;
        }
    }
}
