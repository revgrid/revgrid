import { DataModel } from '../../interfaces/data-model';
import { SubgridInterface } from '../../interfaces/subgrid-interface';
import { PartialPoint, Point } from '../../lib/point';
import { AssertError } from '../../lib/revgrid-error';
import { CellEditor } from '../cell/cell-editor';
import { ViewCell } from '../cell/view-cell';
import { ColumnsManager } from '../column/columns-manager';
import { ViewLayout } from '../view/view-layout';

/** @public */
export class Focus {
    readonly subgrid: SubgridInterface;

    getCellEditorEventer: Focus.GetCellEditorEventer | undefined;

    private _currentSubgridPoint: Point | undefined;
    private _previousSubgridPoint: Point | undefined;

    // Optionally track position in canvas where focus is.  Used to assist with paging
    private _canvasX: number | undefined;
    private _canvasY: number | undefined;

    private _editor: CellEditor | undefined;
    private _cell: ViewCell | undefined;

    constructor(
        private readonly _mainSubgrid: SubgridInterface,
        private readonly _columnsManager: ColumnsManager,
        private readonly _viewLayout: ViewLayout,
        private readonly _cellInvalidatedEventer: Focus.CellInvalidatedEventer,
    ) {
        this.subgrid = this._mainSubgrid;
        this._viewLayout.cellPoolComputedEventer = () => this.handelCellPoolComputedEvent();
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

    reset() {
        this.closeEditor(true);
        this.clear();
    }

    clear() {
        this.undefineCell();
        this._previousSubgridPoint = this.currentSubgridPoint;
        this._currentSubgridPoint = undefined;
    }

    set(newFocusPoint: Point, cell: ViewCell | undefined, canvasPoint: PartialPoint | undefined) {
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
                cell = this._viewLayout.findCellAtGridPoint(newFocusX, newFocusY, this.subgrid);
            }

            if (cell !== undefined) {
                this._cell = cell;
                this._cellInvalidatedEventer(cell);
            }

            this.closeAndCheckTryOpenEditor(false, cell);
        }
    }

    setX(activeColumnIndex: number, cell: ViewCell | undefined, canvasX: number | undefined) {
        const currentSubgridPoint = this._currentSubgridPoint;
        const currentFocusDefined = currentSubgridPoint !== undefined;
        if (!currentFocusDefined || currentSubgridPoint.x !== activeColumnIndex) {
            this.undefineCell();
            this._previousSubgridPoint = currentSubgridPoint;
            const y = currentFocusDefined ? currentSubgridPoint.y : 0;

            this._currentSubgridPoint = {
                x: activeColumnIndex,
                y,
            };

            if (canvasX !== undefined) {
                this._canvasX = canvasX;
            }

            if (cell === undefined) {
                cell = this._viewLayout.findCellAtGridPoint(activeColumnIndex, y, this.subgrid);
            }

            if (cell !== undefined) {
                this._cell = cell;
                this._cellInvalidatedEventer(cell);
            }

            this.closeAndCheckTryOpenEditor(false, cell);
        }
    }

    setY(subgridRowIndex: number, cell: ViewCell | undefined, canvasY: number | undefined) {
        const currentSubgridPoint = this._currentSubgridPoint;
        const currentFocusDefined = currentSubgridPoint !== undefined;
        if (!currentFocusDefined || currentSubgridPoint.y !== subgridRowIndex) {
            this.undefineCell();
            this._previousSubgridPoint = currentSubgridPoint;
            const x = currentFocusDefined ? currentSubgridPoint.x : 0;
            this._currentSubgridPoint = {
                x,
                y: subgridRowIndex,
            };

            if (canvasY !== undefined) {
                this._canvasY = canvasY;
            }

            if (cell === undefined) {
                cell = this._viewLayout.findCellAtGridPoint(x, subgridRowIndex, this.subgrid);
            }

            if (cell !== undefined) {
                this._cell = cell;
                this._cellInvalidatedEventer(cell);
            }

            this.closeAndCheckTryOpenEditor(false, cell);
        }
    }

    setXY(activeColumnIndex: number, subgridRowIndex: number, cell: ViewCell | undefined, canvasX: number | undefined, canvasY: number | undefined) {
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
                cell = this._viewLayout.findCellAtGridPoint(activeColumnIndex, subgridRowIndex, this.subgrid);
            }

            if (cell !== undefined) {
                this._cell = cell;
                this._cellInvalidatedEventer(cell);
            }

            this.closeAndCheckTryOpenEditor(false, cell);
        }
    }

    isActiveColumnFocused(activeColumnIndex: number) {
        return this._currentSubgridPoint !== undefined && activeColumnIndex === this._currentSubgridPoint.x;
    }

    isSubgridRowFocused(subgridRowIndex: number, subgrid: SubgridInterface) {
        return subgrid === this._mainSubgrid && this.isMainSubgridRowFocused(subgridRowIndex);
    }

    isMainSubgridRowFocused(mainSubgridRowIndex: number) {
        return this._currentSubgridPoint !== undefined && mainSubgridRowIndex === this._currentSubgridPoint.y;
    }

    isCellFocused(cell: ViewCell) {
        return cell === this._cell;
    }

    isGridPointFocused(activeColumnIndex: number, subgridRowIndex: number, subgrid: SubgridInterface) {
        return subgrid === this._mainSubgrid && this.isMainSubgridGridPointFocused(activeColumnIndex, subgridRowIndex);
    }

    isMainSubgridGridPointFocused(activeColumnIndex: number, mainSubgridRowIndex: number) {
        return (
            this._currentSubgridPoint !== undefined &&
            activeColumnIndex === this._currentSubgridPoint.x &&
            mainSubgridRowIndex === this._currentSubgridPoint.y
        );
    }

    tryOpenEditor(cell: ViewCell | undefined) {
        if (this._editor === undefined && this.getCellEditorEventer !== undefined) {
            const currentSubgridPoint = this._currentSubgridPoint;
            if (currentSubgridPoint !== undefined) {
                const x = currentSubgridPoint.x;
                const y = currentSubgridPoint.y;
                if (cell === undefined) {
                    cell = this._viewLayout.findLeftGridLineInclusiveCellFromCanvasOffset(x, y);
                } else {
                    if (x !== cell.viewLayoutColumn.activeColumnIndex || y !== cell.viewLayoutRow.subgridRowIndex) {
                        throw new AssertError('FE55598', 'Cell is not focused');
                    }
                }
                if (cell !== undefined) {
                    const editor = this.getCellEditorEventer(cell);
                    if (editor !== undefined) {
                        editor.closedEventer = () => this.handleEditorClosed();
                        this._editor = editor;
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
        if (this._editor !== undefined) {
            this._editor.closedEventer = undefined;
            this._editor.close(cancel);
            this._editor = undefined;
        }
    }

    closeAndCheckTryOpenEditor(cancel: boolean, cell: ViewCell | undefined) {
        this.closeEditor(cancel);

        const currentSubgridPoint = this._currentSubgridPoint;
        if (currentSubgridPoint !== undefined) {
            const column = this._columnsManager.getActiveColumn(currentSubgridPoint.x);
            if (column.settings.editOnFocusCell) {
                this.tryOpenEditor(cell);
            }
        }
    }

    adjustForRowsInserted(rowIndex: number, rowCount: number, dataModel: DataModel) {
        if (dataModel === this._mainSubgrid.dataModel) {
            if (this._currentSubgridPoint !== undefined) {
                Point.adjustForYRangeInserted(this._currentSubgridPoint, rowIndex, rowCount);
            }
            if (this._previousSubgridPoint !== undefined) {
                Point.adjustForYRangeInserted(this._previousSubgridPoint, rowIndex, rowCount);
            }

            this._canvasY = undefined;
        }
    }

    adjustForRowsDeleted(rowIndex: number, rowCount: number, dataModel: DataModel) {
        if (dataModel === this._mainSubgrid.dataModel) {
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

    adjustForRowsMoved(oldRowIndex: number, newRowIndex: number, count: number, dataModel: DataModel) {
        if (dataModel === this._mainSubgrid.dataModel) {
            if (this._currentSubgridPoint !== undefined) {
                Point.adjustForYRangeMoved(this._currentSubgridPoint, oldRowIndex, newRowIndex, count);
            }
            if (this._previousSubgridPoint !== undefined) {
                Point.adjustForYRangeMoved(this._previousSubgridPoint, oldRowIndex, newRowIndex, count);
            }

            this._canvasY = undefined;
        }
    }

    adjustForColumnsInserted(columnIndex: number, columnCount: number) {
        if (this._currentSubgridPoint !== undefined) {
            Point.adjustForXRangeInserted(this._currentSubgridPoint, columnIndex, columnCount);
        }
        if (this._previousSubgridPoint !== undefined) {
            Point.adjustForXRangeInserted(this._previousSubgridPoint, columnIndex, columnCount);
        }

        this._canvasX = undefined;
    }

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

    adjustForColumnsMoved(oldColumnIndex: number, newColumnIndex: number, count: number) {
        if (this._currentSubgridPoint !== undefined) {
            Point.adjustForXRangeMoved(this._currentSubgridPoint, oldColumnIndex, newColumnIndex, count);
        }
        if (this._previousSubgridPoint !== undefined) {
            Point.adjustForXRangeMoved(this._previousSubgridPoint, oldColumnIndex, newColumnIndex, count);
        }

        this._canvasX = undefined;
    }

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

    restoreStash(stash: Focus.Stash) {
        this.clear();

        if (stash.current !== undefined) {
            this._currentSubgridPoint = this.createPointFromStash(stash.current);
        }
        if (stash.previous !== undefined) {
            this._previousSubgridPoint = this.createPointFromStash(stash.previous);
        }
    }

    private handleEditorClosed() {
        if (this._editor !== undefined) {
            this._editor.closedEventer = undefined;
            this._editor = undefined;
        }
    }

    private handelCellPoolComputedEvent() {
        // Called within Request Animation Frame. Do not call any external code.
        const focusPoint = this._currentSubgridPoint;
        if (focusPoint !== undefined) {
            const cell = this._viewLayout.findCellAtGridPoint(focusPoint.x, focusPoint.y, this.subgrid);
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

    private undefineCell() {
        const cell = this._cell;
        if (cell !== undefined) {
            this._cellInvalidatedEventer(cell);
        }
        this._cell = undefined;
    }

    private createStashPoint(point: Point): Focus.Stash.Point | undefined {
        const dataModel = this._mainSubgrid.dataModel;
        if (dataModel.getRowIdFromIndex === undefined) {
            return undefined;
        } else {
            return {
                columnName: this._columnsManager.getActiveColumn(point.x).name,
                rowId: dataModel.getRowIdFromIndex(point.y),
            };
        }
    }

    private createPointFromStash(stashPoint: Focus.Stash.Point): Point | undefined {
        const { columnName, rowId: stashedRowId } = stashPoint;
        const activeColumnIndex = this._columnsManager.getActiveColumnIndexByName(columnName);
        if (activeColumnIndex < 0) {
            return undefined;
        } else {
            const dataModel = this._mainSubgrid.dataModel;
            if (dataModel.getRowIndexFromId !== undefined) {
                const rowIndex = dataModel.getRowIndexFromId(stashedRowId);
                if (rowIndex === undefined) {
                    throw new AssertError('FCPFSI50884'); // reindex should not lose row
                } else {
                    return {
                        x: activeColumnIndex,
                        y: rowIndex,
                    };
                }
            } else {
                if (dataModel.getRowIdFromIndex !== undefined) {
                    const rowCount = this._mainSubgrid.getRowCount();
                    for (let rowIndex = 0; rowIndex < rowCount; ++rowIndex) {
                        const rowId = dataModel.getRowIdFromIndex(rowIndex);
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
    export type GetCellEditorEventer = (this: void, cell: ViewCell) => CellEditor | undefined;
    export type CellInvalidatedEventer = (this: void, cell: ViewCell) => void;

    export interface Stash {
        readonly current: Stash.Point | undefined;
        readonly previous: Stash.Point | undefined;
    }

    export namespace Stash {
        export interface Point {
            readonly columnName: string;
            readonly rowId: unknown;
        }
    }
}
