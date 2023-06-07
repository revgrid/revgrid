import { CellEditor } from '../../interfaces/data/cell-editor';
import { DataServer } from '../../interfaces/data/data-server';
import { MainSubgrid } from '../../interfaces/data/main-subgrid';
import { Subgrid } from '../../interfaces/data/subgrid';
import { ViewCell } from '../../interfaces/data/view-cell';
import { SchemaServer } from '../../interfaces/schema/schema-server';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { PartialPoint, Point } from '../../types-utils/point';
import { AssertError } from '../../types-utils/revgrid-error';
import { ColumnsManager } from '../column/columns-manager';
import { ViewLayout } from '../view/view-layout';

/** @public */
export class Focus<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SC extends SchemaServer.Column<BCS>> {
    getCellEditorEventer: Focus.GetCellEditorEventer<BCS, SC>;

    /** @internal */
    changedEventer: Focus.ChangedEventer;
    /** @internal */
    viewCellRenderInvalidatedEventer: Focus.ViewCellRenderInvalidatedEventer<BCS, SC>;

    readonly subgrid: Subgrid<BCS, SC>;
    readonly dataServer: DataServer<BCS>;

    /** @internal */
    private _currentSubgridPoint: Point | undefined;
    /** @internal */
    private _previousSubgridPoint: Point | undefined;

    // Optionally track position in canvas where focus is.  Used to assist with paging
    /** @internal */
    private _canvasX: number | undefined;
    /** @internal */
    private _canvasY: number | undefined;

    /** @internal */
    private _editor: CellEditor<BCS, SC> | undefined;
    /** @internal */
    private _cell: ViewCell<BCS, SC> | undefined;

    /** @internal */
    constructor(
        /** @internal */
        private readonly _gridSettings: BGS,
        /** @internal */
        private readonly _mainSubgrid: MainSubgrid<BCS, SC>,
        /** @internal */
        private readonly _columnsManager: ColumnsManager<BGS, BCS, SC>,
        /** @internal */
        private readonly _viewLayout: ViewLayout<BGS, BCS, SC>,
    ) {
        this.subgrid = this._mainSubgrid;
        this.dataServer = this.subgrid.dataServer;
        this._viewLayout.cellPoolComputedEventerForFocus = () => this.handleCellPoolComputedEvent();
    }

    get currentSubgridX() { return this._currentSubgridPoint === undefined ? undefined : this._currentSubgridPoint.x; }
    get currentSubgridY() { return this._currentSubgridPoint === undefined ? undefined : this._currentSubgridPoint.y; }

    get currentSubgridPoint() { return this._currentSubgridPoint; }
    get previousSubgridPoint() { return this._previousSubgridPoint; }

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
        this._previousSubgridPoint = this.currentSubgridPoint;
        this._currentSubgridPoint = undefined;
    }

    set(newFocusPoint: Point, cell: ViewCell<BCS, SC> | undefined, canvasPoint: PartialPoint | undefined) {
        const newFocusX = newFocusPoint.x;
        const newFocusY = newFocusPoint.y;
        const currentSubgridPoint = this._currentSubgridPoint;
        const currentFocusDefined = currentSubgridPoint !== undefined;
        if (!currentFocusDefined || currentSubgridPoint.x !== newFocusX || currentSubgridPoint.y !== newFocusY) {
            this.closeFocus();
            this._previousSubgridPoint = currentSubgridPoint;
            this._currentSubgridPoint = newFocusPoint;

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
                this.viewCellRenderInvalidatedEventer(cell);
            }

            this.closeAndCheckTryOpenEditor(false);

            this.fireFocusChanged();
        }
    }

    setX(activeColumnIndex: number, cell: ViewCell<BCS, SC> | undefined, canvasX: number | undefined) {
        const currentSubgridPoint = this._currentSubgridPoint;
        const currentFocusDefined = currentSubgridPoint !== undefined;
        if (!currentFocusDefined || currentSubgridPoint.x !== activeColumnIndex) {
            this.closeFocus();
            this._previousSubgridPoint = currentSubgridPoint;
            const y = currentFocusDefined ? currentSubgridPoint.y : this._gridSettings.fixedRowCount;

            this._currentSubgridPoint = {
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
                this.viewCellRenderInvalidatedEventer(cell);
            }

            this.closeAndCheckTryOpenEditor(false);

            this.fireFocusChanged();
        }
    }

    setY(subgridRowIndex: number, cell: ViewCell<BCS, SC> | undefined, canvasY: number | undefined) {
        const currentSubgridPoint = this._currentSubgridPoint;
        const currentFocusDefined = currentSubgridPoint !== undefined;
        if (!currentFocusDefined || currentSubgridPoint.y !== subgridRowIndex) {
            this.closeFocus();
            this._previousSubgridPoint = currentSubgridPoint;
            const x = currentFocusDefined ? currentSubgridPoint.x : this._gridSettings.fixedColumnCount;
            this._currentSubgridPoint = {
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
                this.viewCellRenderInvalidatedEventer(cell);
            }

            this.closeAndCheckTryOpenEditor(false);

            this.fireFocusChanged();
        }
    }

    setXY(activeColumnIndex: number, subgridRowIndex: number, cell: ViewCell<BCS, SC> | undefined, canvasX: number | undefined, canvasY: number | undefined) {
        const currentSubgridPoint = this._currentSubgridPoint;
        const currentFocusDefined = currentSubgridPoint !== undefined;
        if (!currentFocusDefined || currentSubgridPoint.x !== activeColumnIndex || currentSubgridPoint.y !== subgridRowIndex) {
            this.closeFocus();
            this._previousSubgridPoint = currentSubgridPoint;
            this._currentSubgridPoint = {
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
                this.viewCellRenderInvalidatedEventer(cell);
            }

            this.closeAndCheckTryOpenEditor(false);

            this.fireFocusChanged();
        }
    }

    isActiveColumnFocused(activeColumnIndex: number) {
        return this._currentSubgridPoint !== undefined && activeColumnIndex === this._currentSubgridPoint.x;
    }

    isSubgridRowFocused(subgridRowIndex: number, subgrid: Subgrid<BCS, SC>) {
        return subgrid === this._mainSubgrid && this.isMainSubgridRowFocused(subgridRowIndex);
    }

    isMainSubgridRowFocused(mainSubgridRowIndex: number) {
        return this._currentSubgridPoint !== undefined && mainSubgridRowIndex === this._currentSubgridPoint.y;
    }

    isCellFocused(cell: ViewCell<BCS, SC>) {
        return cell === this._cell;
    }

    isGridPointFocused(activeColumnIndex: number, subgridRowIndex: number, subgrid: Subgrid<BCS, SC>) {
        return subgrid === this._mainSubgrid && this.isMainSubgridGridPointFocused(activeColumnIndex, subgridRowIndex);
    }

    isMainSubgridGridPointFocused(activeColumnIndex: number, mainSubgridRowIndex: number) {
        return (
            this._currentSubgridPoint !== undefined &&
            activeColumnIndex === this._currentSubgridPoint.x &&
            mainSubgridRowIndex === this._currentSubgridPoint.y
        );
    }

    tryOpenEditor() {
        if (this._editor !== undefined) {
            return true;
        } else {
            if (this.getCellEditorEventer === undefined) {
                return false;
            } else {
                const focusedPoint = this._currentSubgridPoint;
                if (focusedPoint === undefined) {
                    throw new AssertError('FTOE17778');
                } else {
                    const column = this._columnsManager.getActiveColumn(focusedPoint.x);
                    const schemaColumn = column.schemaColumn;
                    const subgridRowIndex = focusedPoint.y;
                    const readonly = this.dataServer.setValue === undefined;
                    const cell = this._cell;
                    const editor = this.getCellEditorEventer(schemaColumn, subgridRowIndex, this.subgrid, readonly, cell);
                    if (editor === undefined) {
                        return false;
                    } else {
                        editor.pullDataEventer = () => this.getFocusedDataValue();
                        if (!readonly) {
                            editor.pushDataEventer = (value) => this.setFocusedDataValue(value);
                        }
                        editor.closedEventer = (value) => this.handleEditorClosed(value);
                        this._editor = editor;
                        const initialValue = this.dataServer.getValue(schemaColumn, subgridRowIndex);
                        editor.open(initialValue);

                        if (cell !== undefined && editor.setBounds !== undefined) {
                            editor.setBounds(cell.bounds);
                        }

                        if (editor.focus !== undefined) {
                            editor.focus();
                        }

                        return true;
                    }
                }
            }
        }
    }

    /** Returns true editor was already opened or could be opend by key */
    tryOpenEditorWithKey(_key: string) {
        // not yet implemented
        return this.editor !== undefined;
    }

    closeEditor(cancel: boolean) {
        const editor = this._editor;
        if (editor !== undefined) {
            this._editor = undefined;
            const value = editor.close(cancel);
            this.finaliseEditor(editor, value);
        }
    }

    /** @internal */
    closeAndCheckTryOpenEditor(cancel: boolean) {
        this.closeEditor(cancel);

        const currentSubgridPoint = this._currentSubgridPoint;
        if (currentSubgridPoint !== undefined) {
            const column = this._columnsManager.getActiveColumn(currentSubgridPoint.x);
            if (column.settings.editOnFocusCell) {
                this.tryOpenEditor();
            }
        }
    }

    /** @internal */
    adjustForRowsInserted(rowIndex: number, rowCount: number, dataServer: DataServer<BCS>) {
        if (dataServer === this._mainSubgrid.dataServer) {
            if (this._currentSubgridPoint !== undefined) {
                Point.adjustForYRangeInserted(this._currentSubgridPoint, rowIndex, rowCount);
            }
            if (this._previousSubgridPoint !== undefined) {
                Point.adjustForYRangeInserted(this._previousSubgridPoint, rowIndex, rowCount);
            }

            this._canvasY = undefined;
        }
    }

    /** @internal */
    adjustForRowsDeleted(rowIndex: number, rowCount: number, dataServer: DataServer<BCS>) {
        if (dataServer === this._mainSubgrid.dataServer) {
            if (this._currentSubgridPoint !== undefined) {
                const positionInDeletionRange = Point.adjustForYRangeDeleted(this._currentSubgridPoint, rowIndex, rowCount);
                if (positionInDeletionRange !== undefined) {
                    this._currentSubgridPoint = undefined;
                }
            }
            if (this._previousSubgridPoint !== undefined) {
                const positionInDeletionRange = Point.adjustForYRangeDeleted(this._previousSubgridPoint, rowIndex, rowCount);
                if (positionInDeletionRange !== undefined) {
                    this._previousSubgridPoint = undefined;
                }
            }

            this._canvasY = undefined;
        }
    }

    /** @internal */
    adjustForRowsMoved(oldRowIndex: number, newRowIndex: number, count: number, dataServer: DataServer<BCS>) {
        if (dataServer === this._mainSubgrid.dataServer) {
            if (this._currentSubgridPoint !== undefined) {
                Point.adjustForYRangeMoved(this._currentSubgridPoint, oldRowIndex, newRowIndex, count);
            }
            if (this._previousSubgridPoint !== undefined) {
                Point.adjustForYRangeMoved(this._previousSubgridPoint, oldRowIndex, newRowIndex, count);
            }

            this._canvasY = undefined;
        }
    }

    /** @internal */
    adjustForColumnsInserted(columnIndex: number, columnCount: number) {
        if (this._currentSubgridPoint !== undefined) {
            Point.adjustForXRangeInserted(this._currentSubgridPoint, columnIndex, columnCount);
        }
        if (this._previousSubgridPoint !== undefined) {
            Point.adjustForXRangeInserted(this._previousSubgridPoint, columnIndex, columnCount);
        }

        this._canvasX = undefined;
    }

    /** @internal */
    adjustForColumnsDeleted(columnIndex: number, columnCount: number) {
        if (this._currentSubgridPoint !== undefined) {
            const positionInDeletionRange = Point.adjustForXRangeDeleted(this._currentSubgridPoint, columnIndex, columnCount);
            if (positionInDeletionRange !== undefined) {
                this._currentSubgridPoint = undefined;
            }
        }
        if (this._previousSubgridPoint !== undefined) {
            const positionInDeletionRange = Point.adjustForXRangeDeleted(this._previousSubgridPoint, columnIndex, columnCount);
            if (positionInDeletionRange !== undefined) {
                this._previousSubgridPoint = undefined;
            }
        }

        this._canvasX = undefined;
    }

    /** @internal */
    adjustForColumnsMoved(oldColumnIndex: number, newColumnIndex: number, count: number) {
        if (this._currentSubgridPoint !== undefined) {
            Point.adjustForXRangeMoved(this._currentSubgridPoint, oldColumnIndex, newColumnIndex, count);
        }
        if (this._previousSubgridPoint !== undefined) {
            Point.adjustForXRangeMoved(this._previousSubgridPoint, oldColumnIndex, newColumnIndex, count);
        }

        this._canvasX = undefined;
    }

    /** @internal */
    createStash(): Focus.Stash {
        let currentStashPoint: Focus.Stash.Point | undefined;
        if (this._currentSubgridPoint !== undefined) {
            currentStashPoint = this.createStashPoint(this._currentSubgridPoint);
        }
        let previousStashPoint: Focus.Stash.Point | undefined;
        if (this._previousSubgridPoint !== undefined) {
            previousStashPoint = this.createStashPoint(this._previousSubgridPoint);
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
            this._currentSubgridPoint = this.createPointFromStash(stash.current);
        }
        if (stash.previous !== undefined) {
            this._previousSubgridPoint = this.createPointFromStash(stash.previous);
        }
    }

    /** @internal */
    private handleEditorClosed(value: DataServer.DataValue | undefined) {
        const editor = this._editor;
        if (editor !== undefined) {
            this._editor = undefined;
            this.finaliseEditor(editor, value);
        }
    }

    /** @internal */
    private handleCellPoolComputedEvent() {
        // Called within Request Animation Frame. Do not call any external code.
        const focusPoint = this._currentSubgridPoint;
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
        this.changedEventer(this._previousSubgridPoint, this._currentSubgridPoint);
    }

    /** @internal */
    private finaliseEditor(editor: CellEditor<BCS, SC>, value: DataServer.DataValue | undefined) {
        editor.closedEventer = undefined;
        editor.pullDataEventer = undefined;
        editor.pushDataEventer = undefined;
        if (!editor.readonly && value !== undefined) {
            this.setFocusedDataValue(value);
        }
    }

    /** @internal */
    private getFocusedDataValue() {
        const focusedPoint = this._currentSubgridPoint;
        if (focusedPoint === undefined) {
            throw new AssertError('FGFDV17778');
        } else {
            const column = this._columnsManager.getActiveColumn(focusedPoint.x);
            return this.dataServer.getValue(column.schemaColumn, focusedPoint.y);
        }
    }

    /** @internal */
    private setFocusedDataValue(value: DataServer.DataValue) {
        const focusedPoint = this._currentSubgridPoint;
        if (focusedPoint === undefined) {
            throw new AssertError('FGFDVF17778');
        } else {
            if (this.dataServer.setValue === undefined) {
                throw new AssertError('FGFDVS17778');
            } else {
                const column = this._columnsManager.getActiveColumn(focusedPoint.x);
                return this.dataServer.setValue(column.schemaColumn, focusedPoint.y, value);
            }
        }
    }

    /** @internal */
    private closeFocus() {
        this.closeEditor(false);

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
                columnName: this._columnsManager.getActiveColumn(point.x).name,
                rowId: dataServer.getRowIdFromIndex(point.y),
            };
        }
    }

    /** @internal */
    private createPointFromStash(stashPoint: Focus.Stash.Point): Point | undefined {
        const { columnName, rowId: stashedRowId } = stashPoint;
        const activeColumnIndex = this._columnsManager.getActiveColumnIndexByName(columnName);
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
    export type GetCellEditorEventer<BCS extends BehavioredColumnSettings, SC extends SchemaServer.Column<BCS>> = (
        this: void,
        schemaColumn: SC,
        subgridRowIndex: number,
        subgrid: Subgrid<BCS, SC>,
        readonly: boolean,
        cell: ViewCell<BCS, SC> | undefined
    ) => CellEditor<BCS, SC> | undefined;

    /** @internal */
    export type ChangedEventer = (this: void, oldPoint: Point | undefined, newPoint: Point | undefined) => void;
    /** @internal */
    export type ViewCellRenderInvalidatedEventer<BCS extends BehavioredColumnSettings, SC extends SchemaServer.Column<BCS>> = (this: void, cell: ViewCell<BCS, SC>) => void;

    /** @internal */
    export interface Stash {
        readonly current: Stash.Point | undefined;
        readonly previous: Stash.Point | undefined;
    }

    /** @internal */
    export namespace Stash {
        export interface Point {
            readonly columnName: string;
            readonly rowId: unknown;
        }
    }
}
