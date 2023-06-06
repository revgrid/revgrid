import { DataServer } from '../../interfaces/data/data-server';
import { MainSubgrid } from '../../interfaces/data/main-subgrid';
import { Subgrid } from '../../interfaces/data/subgrid';
import { ViewCell } from '../../interfaces/data/view-cell';
import { CellEditor } from '../../interfaces/dataless/cell-editor';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { PartialPoint, Point } from '../../types-utils/point';
import { AssertError } from '../../types-utils/revgrid-error';
import { ColumnsManager } from '../column/columns-manager';
import { ViewLayout } from '../view/view-layout';

/** @public */
export class Focus<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings> {
    /** @internal */
    changedEventer: Focus.ChangedEventer;
    /** @internal */
    viewCellRenderInvalidatedEventer: Focus.ViewCellRenderInvalidatedEventer<BCS>;
    /** @internal */
    getCellEditorEventer: Focus.GetCellEditorEventer<BCS>;

    readonly subgrid: Subgrid<BCS>;
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
    private _editor: CellEditor<BCS> | undefined;
    /** @internal */
    private _cell: ViewCell<BCS> | undefined;

    /** @internal */
    constructor(
        /** @internal */
        private readonly _gridSettings: BGS,
        /** @internal */
        private readonly _mainSubgrid: MainSubgrid<BCS>,
        /** @internal */
        private readonly _columnsManager: ColumnsManager<BGS, BCS>,
        /** @internal */
        private readonly _viewLayout: ViewLayout<BGS, BCS>,
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
        this.closeEditor(true);
        this.undefineCell();
        this._previousSubgridPoint = this.currentSubgridPoint;
        this._currentSubgridPoint = undefined;
    }

    set(newFocusPoint: Point, cell: ViewCell<BCS> | undefined, canvasPoint: PartialPoint | undefined) {
        const newFocusX = newFocusPoint.x;
        const newFocusY = newFocusPoint.y;
        const currentSubgridPoint = this._currentSubgridPoint;
        const currentFocusDefined = currentSubgridPoint !== undefined;
        if (!currentFocusDefined || currentSubgridPoint.x !== newFocusX || currentSubgridPoint.y !== newFocusY) {
            this.undefineCell();
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

    setX(activeColumnIndex: number, cell: ViewCell<BCS> | undefined, canvasX: number | undefined) {
        const currentSubgridPoint = this._currentSubgridPoint;
        const currentFocusDefined = currentSubgridPoint !== undefined;
        if (!currentFocusDefined || currentSubgridPoint.x !== activeColumnIndex) {
            this.undefineCell();
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

    setY(subgridRowIndex: number, cell: ViewCell<BCS> | undefined, canvasY: number | undefined) {
        const currentSubgridPoint = this._currentSubgridPoint;
        const currentFocusDefined = currentSubgridPoint !== undefined;
        if (!currentFocusDefined || currentSubgridPoint.y !== subgridRowIndex) {
            this.undefineCell();
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

    setXY(activeColumnIndex: number, subgridRowIndex: number, cell: ViewCell<BCS> | undefined, canvasX: number | undefined, canvasY: number | undefined) {
        const currentSubgridPoint = this._currentSubgridPoint;
        const currentFocusDefined = currentSubgridPoint !== undefined;
        if (!currentFocusDefined || currentSubgridPoint.x !== activeColumnIndex || currentSubgridPoint.y !== subgridRowIndex) {
            this.undefineCell();
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

    isSubgridRowFocused(subgridRowIndex: number, subgrid: Subgrid<BCS>) {
        return subgrid === this._mainSubgrid && this.isMainSubgridRowFocused(subgridRowIndex);
    }

    isMainSubgridRowFocused(mainSubgridRowIndex: number) {
        return this._currentSubgridPoint !== undefined && mainSubgridRowIndex === this._currentSubgridPoint.y;
    }

    isCellFocused(cell: ViewCell<BCS>) {
        return cell === this._cell;
    }

    isGridPointFocused(activeColumnIndex: number, subgridRowIndex: number, subgrid: Subgrid<BCS>) {
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
            const cell = this._cell;
            if (cell === undefined || this.getCellEditorEventer === undefined) {
                return false;
            } else {
                const editor = this.getCellEditorEventer(cell);
                if (editor === undefined) {
                    return false;
                } else {
                    editor.closedEventer = () => this.handleEditorClosed();
                    this._editor = editor;
                    return true;
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
        if (this._editor !== undefined) {
            this._editor.closedEventer = undefined;
            this._editor.close(cancel);
            this._editor = undefined;
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
    private handleEditorClosed() {
        if (this._editor !== undefined) {
            this._editor.closedEventer = undefined;
            this._editor = undefined;
        }
    }

    /** @internal */
    private handleCellPoolComputedEvent() {
        // Called within Request Animation Frame. Do not call any external code.
        const focusPoint = this._currentSubgridPoint;
        if (focusPoint !== undefined) {
            const cell = this._viewLayout.findCellAtGridPoint(focusPoint.x, focusPoint.y, this.subgrid, false);
            if (cell !== this._cell) {
                const editor = this._editor;
                if (editor !== undefined) {
                    // Focus has an editor which either was hidden or needs its location changed
                    if (cell === undefined) {
                        // editor became hidden
                        setTimeout(() => {
                            // defer to next tick
                            if (editor.hide !== undefined) {
                                editor.hide();
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
    }

    /** @internal */
    private fireFocusChanged() {
        this.changedEventer(this._previousSubgridPoint, this._currentSubgridPoint);
    }

    /** @internal */
    private undefineCell() {
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
    /** @internal */
    export type ChangedEventer = (this: void, oldPoint: Point | undefined, newPoint: Point | undefined) => void;
    /** @internal */
    export type ViewCellRenderInvalidatedEventer<BCS extends BehavioredColumnSettings> = (this: void, cell: ViewCell<BCS>) => void;
    /** @internal */
    export type GetCellEditorEventer<BCS extends BehavioredColumnSettings> = (this: void, viewCell: ViewCell<BCS>) => CellEditor<BCS>;

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
