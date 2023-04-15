
import { ColumnsManager } from '../column/columns-manager';
import { SubgridInterface } from '../common/subgrid-interface';
import { Focus } from '../focus';
import { GridProperties } from '../grid-properties';
import { Point } from '../grid-public-api';
import { AssertError, UnreachableCaseError } from '../lib/revgrid-error';
import { SelectionArea } from '../lib/selection-area';
import { calculateNumberArrayUniqueCount } from '../lib/utils';
import { Subgrid } from '../subgrid/subgrid';
import { LastSelectionArea } from './last-selection-area';
import { SelectionRangeList } from './selection-range-list';
import { SelectionRectangle } from './selection-rectangle';
import { SelectionRectangleList } from './selection-rectangle-list';
import { SelectionStash } from './selection-stash';

/**
 *
 * @desc We represent selections as a list of rectangles because large areas can be represented and tested against quickly with a minimal amount of memory usage. Also we need to maintain the selection rectangles flattened counter parts so we can test for single dimension contains. This is how we know to highlight the fixed regions on the edges of the grid.
 */

export class Selection {
    readonly rows = new SelectionRangeList();
    readonly columns = new SelectionRangeList();
    readonly rectangleList = new SelectionRectangleList();

    changedEventer: Selection.ChangedEventer;

    private _lastArea: LastSelectionArea | undefined;
    private _allRowsSelected = false;

    private _beginChangeCount = 0;
    private _changed = false;
    private _silentlyChanged = false;

    private _lastEdgeSelectionX = 0;
    private _lastEdgeSelectionY = 0;

    private _snapshot: Selection | undefined;

    private _focusSubgridChangedListener = () => this.handleSubgridChanged();

    /** @internal */
    private _nestedStashSelectionsRequestCount = 0;
    /** @internal */
    private _stash: SelectionStash | undefined;

    constructor(
        private readonly _gridProperties: GridProperties,
        private readonly _columnsManager: ColumnsManager,
        private readonly _focus: Focus,
    ) {
        this._focus.subscribeSubgridChangedEvent(this._focusSubgridChangedListener);
    }

    get focusedSubgrid() { return this._focus.subgrid; }

    get hasRectangles() { return this.rectangleList.has; }

    get allRowsSelected() { return this._allRowsSelected; }
    set allRowsSelected(value: boolean) {
        this.beginChange();
        if (value !== this._allRowsSelected) {
            this._allRowsSelected = value;
            this._changed = true;
        }
        this.endChange();
    }

    get areaCount(): number { return this.rectangleList.areaCount + this.rows.areaCount + this.columns.areaCount; }
    get lastArea() { return this._lastArea; }

    destroy() {
        this._focus.unsubscribeSubgridChangedEvent(this._focusSubgridChangedListener);
    }

    beginChange() {
        ++this._beginChangeCount;
    }

    endChange() {
        if (--this._beginChangeCount === 0) {
            if (this._changed) {
                this._changed = false;
                const silentlyChanged = this._silentlyChanged;
                this._silentlyChanged = false;

                // const gridProps = this._gridProperties;

                // if (!gridProps.checkboxOnlyRowSelections && gridProps.autoSelectRows) {
                //     // Project the cell selection into the rows
                //     this.selectRowsFromCellsOrLastRectangle();
                // }

                // if (gridProps.autoSelectColumns) {
                //     // Project the cell selection into the columns
                //     this.selectColumnsFromRectangles();
                // }

                if (!silentlyChanged) {
                    this.changedEventer();
                }
            }
        } else {
            if (this._beginChangeCount < 0) {
                throw new AssertError('SMEC91004', 'Mismatched SelectionModel begin/endChange callback');
            }
        }
    }

    assign(other: Selection) {
        this.rectangleList.assign(other.rectangleList);
        this.rows.assign(other.rows);
        this.columns.assign(other.columns);
        this._allRowsSelected = other._allRowsSelected;
    }

    requestStashSelection() {
        if (this._nestedStashSelectionsRequestCount++ === 0) {
            this.stash();
        }
    }

    requestUnstashSelection() {
        if (--this._nestedStashSelectionsRequestCount === 0) {
            this.unstash();
        }
    }

    saveSnapshot() {
        this._snapshot = new Selection(this._gridProperties, this._columnsManager, this._focus);
        this._snapshot.assign(this);
    }

    restoreSavedSnapshot() {
        const snapshot = this._snapshot;
        if (snapshot === undefined) {
            throw new AssertError('SRSS50012');
        } else {
            this.assign(snapshot);
        }
        this._snapshot = undefined;
    }

    deleteSavedSnapshot() {
        this._snapshot = undefined;
    }

    // selectRowsFromCellsOrLastRectangle() {
    //     if (!this._gridProperties.singleRowSelectionMode) {
    //         this.selectRowsFromRectangles(0, true);
    //     } else {
    //         const last = this.getLastRectangle();
    //         if (last !== undefined) {
    //             this.clearRowSelection();
    //             const columnIndex = last.first.x
    //             const start = last.origin.y;
    //             const stop = last.corner.y;
    //             this.selectRows(start, stop, undefined, columnIndex);
    //         } else {
    //             this.clearRowSelection();
    //         }
    //     }
    //     this.changedEventer();
    // }

    getLastRectangle() {
        return this.rectangleList.getLastRectangle();
    }

    /**
     * @desc empty out all our state
     */
    clear() {
        this.beginChange();
        try {
            let changed = false;
            if (this.rectangleList.has) {
                this.rectangleList.clear();
                changed = true;
            }

            if (!this.columns.isEmpty()) {
                this.columns.clear();
                changed = true;
            }

            if (!this.rows.isEmpty() || this._allRowsSelected) {
                this.rows.clear();
                this._allRowsSelected = false;
                changed = true;
            }

            this._lastArea = undefined;

            if (changed) {
                this.flagChanged(false); // was previously not flagged as changed
            }
        } finally {
            this.endChange();
        }
    }

    selectCell(x: number, y: number, subgrid: SubgridInterface, areaTypeSpecifier: SelectionArea.TypeSpecifier) {
        this.beginChange();
        try {
            this.clear();
            const areaType = this.calculateAreaType(areaTypeSpecifier);
            switch (areaType) {
                case SelectionArea.Type.Rectangle: {
                    this.selectRectangle(x, y, x, y);
                    break;
                }
                case SelectionArea.Type.Column: {
                    this.selectColumns(x, y, x, y);
                    break;
                }
                case SelectionArea.Type.Row: {
                    this.selectRows(x, y, x, y);
                    break;
                }
            }

        } finally {
            this.endChange();
        }
    }
/**
     * @description Select the region described by the given coordinates.
     *
     * @param originX - origin x coordinate
     * @param originY - origin y coordinate
     * @param extentX - extent x coordinate (width - 1)
     * @param extentY - extent y coordinate (height - 1)
     * @param silent - whether to fire selection changed event
     */
    selectRectangle(originX: number, originY: number, extentX: number, extentY: number, silent = false) {
        this.beginChange();
        try {
            if (this.areaCount > 0) {
                this.saveSnapshot();
            }
            const rectangle = new SelectionRectangle(originX, originY, extentX + 1, extentY + 1);

            if (this._gridProperties.multipleSelectionAreas) {
                this.rectangleList.push(rectangle);
            } else {
                this.rectangleList.only(rectangle);
            }
            this._lastArea = new LastSelectionArea(SelectionArea.Type.Rectangle, rectangle.origin, rectangle.corner, rectangle.first);

            this.flagChanged(silent);
        } finally {
            this.endChange()
        }
    }

    selectRows(originX: number, originY: number, extentX: number, extentY: number) {
        this.beginChange();

        // if (this._gridProperties.singleRowSelectionMode) {
        //     this.clearRowSelection();
        //     extentY = 1;
        // }

        const changed = this.rows.select(originY, extentY);
        if (changed) {
            const origin: Point = { x: originX, y: originY };
            const corner: Point = { x: originX + extentX, y: originY + extentY };
            const first: Point = { x: originX, y: originY };
            this._lastArea = new LastSelectionArea(SelectionArea.Type.Row, origin, corner, first);
            this.flagChanged(false);
        }
        this.endChange();
    }

    deselectRows(y: number, count: number) {
        const changed = this.rows.delete(y, count);
        if (changed) {
            const lastArea = this._lastArea;
            if (lastArea !== undefined && lastArea.areaType === SelectionArea.Type.Row) {
                const start = lastArea.origin.y;
                const length = lastArea.corner.y - start;
                const overlap = this.rows.calculateOverlap(start, length);
                if (overlap === undefined) {
                    this._lastArea = undefined;
                } else {

                }
            }
        }
    }

    selectColumns(originX: number, originY: number, extentX: number, extentY: number) {
        this.beginChange();

        const changed = this.rows.select(originX, extentX);
        if (changed) {
            const origin: Point = { x: originX, y: originY };
            const corner: Point = { x: originX + extentX, y: originY + extentY };
            const first: Point = { x: originX, y: originY };
            this._lastArea = new LastSelectionArea(SelectionArea.Type.Row, origin, corner, first);
            this.flagChanged(false);
        }
        this.endChange();
    }

    // /**
    //  * @desc Remove the last selection that was created.
    //  */
    // clearMostRecentRectangleSelection() {
    //     this.beginChange();
    //     try {
    //         console.debug('clearmostrecent');
    //         const keepRowSelections = this._gridProperties.checkboxOnlyRowSelections;
    //         if (!keepRowSelections) {
    //             this.allRowsSelected = false;
    //         }
    //         const changed = this.rectangleList.removeLast();
    //         this.setLastSelectionType(SelectionArea.Type.Rectangle, !this.rectangleList.has);

    //         if (changed) {
    //             this.flagChanged(false);
    //         }
    //     } finally {
    //         this.endChange();
    //     }
    // }

    // restorePreviousColumnSelection() {
    //     this.columns.restorePreviousSelection();
    //     this.setLastSelectionType(SelectionArea.Type.Column, !this.columns.ranges.length);
    // }

    // restorePreviousRowSelection() {
    //     this.rows.restorePreviousSelection();
    //     this.setLastSelectionType(SelectionArea.Type.Row, !this.rows.ranges.length);
    // }

    // clearRowSelection() {
    //     this.beginChange();
    //     this.allRowsSelected = false;
    //     this.rows.clear();
    //     this.setLastSelectionType(SelectionArea.Type.Row, !this.rows.ranges.length);
    //     this.endChange();
    // }

    hasRowSelections() {
        return !this.rows.isEmpty();
    }

    hasColumnSelections() {
        return !this.columns.isEmpty();
    }

    /**
     * @summary Selection query function.
     * @returns The given cell is selected (part of an active selection).
     */
    isCellSelectedInAnyAreaType(x: number, y: number, subgrid: SubgridInterface): boolean {
        const { rowSelected, columnSelected, cellSelected } = this.getCellSelectedAreaTypes(x, y, subgrid);
        return (rowSelected || columnSelected || cellSelected);
    }

    isRowSelected(y: number, subgrid: Subgrid | undefined) {
        const selected =
            (subgrid === undefined || subgrid === this.focusedSubgrid)
            &&
            (this._allRowsSelected || this.rows.isSelected(y));
        return selected;
    }

    getCellSelectedAreaTypes(x: number, y: number, subgrid: SubgridInterface): Selection.CellSelectedAreaTypes {
        if (subgrid === this.focusedSubgrid) {
            return {
                rowSelected: this._allRowsSelected || this.rows.isSelected(y),
                columnSelected: this.columns.isSelected(x),
                cellSelected: this.rectangleList.anyContainPoint(x, y),
            };
        } else {
            return {
                rowSelected: false,
                columnSelected: false,
                cellSelected: false,
            };
        }
    }

    selectAllRows() {
        this.clear();
        this.allRowsSelected = true;
    }

    getRowCount() {
        if (this.allRowsSelected) {
            return this._focus.subgrid.getRowCount();
        } else {
            if (this.rows.isEmpty()) {
                return this.rectangleList.getUniqueXIndices();
            } else {
                if (this.rectangleList.isEmpty()) {
                    return this.rows.getCount();
                } else {
                    const rangeIndices = this.rows.getIndices();
                    const rectangleIndices = this.rectangleList.getNonUniqueXIndices();
                    const allIndices = [...rangeIndices, ...rectangleIndices];
                    return calculateNumberArrayUniqueCount(allIndices);
                }
            }
        }
    }

    getRowIndices() {
        if (this.allRowsSelected) {
            const rowCount = this._focus.subgrid.getRowCount();
            const result = new Array<number>(rowCount);
            for (let i = 0; i < rowCount; i++) {
                result[i] = i;
            }
            return result;
        } else {
            return this.rows.getIndices();
        }
    }

    getColumnIndices() {
        return this.columns.getIndices();
    }

    isColumnOrRowSelected() {
        return !this.columns.isEmpty() || !this.rows.isEmpty();
    }

    getRectangleFlattenedYs() {
        this.rectangleList.getFlattenedYs();
    }

    getAreasCoveringCell(x: number, y: number) {

    }

    selectRowsFromRectangles(offset: number, keepRowSelections: boolean) {
        const rows = this.rows;

        if (!keepRowSelections) {
            this.allRowsSelected = false;
            this.clearRowSelection();
        }

        const last = this.getLastRectangle();

        this.rectangleList.rectangles.forEach((rectangle) => {
            if (rectangle !== last) {
                let start = rectangle.origin.y;
                const extent = rectangle.extent.y;
                start += offset;
                rows.select(start, extent);
            }
        });

        if (last !== undefined) {
            const columnIndex = last.first.x
            let start = last.origin.y;
            const extent = last.extent.y;
            start += offset;
            this.selectRows(start, start + extent, undefined, columnIndex);
        }
    }

    selectColumnsFromRectangles(offset = 0) {
        const sm = this.columns;
        sm.clear();

        this.rectangleList.rectangles.forEach((rectangle) => {
            let left = rectangle.origin.x;
            const extent = rectangle.extent.x;
            left += offset;
            sm.select(left, extent);
        });
    }

    isPointInLastRectangle(x: number, y: number) {
        const lastRectangle = this.getLastRectangle();
        if (lastRectangle === undefined) {
            return false;
        } else {
            return lastRectangle.containsXY(x, y);
        }
    }

    adjustForRowsInserted(rowIndex: number, rowCount: number) {
        this.beginChange();
        try {
            const lastArea = this._lastArea;
            if (lastArea !== undefined) {
                lastArea.adjustForYRangeInserted(rowIndex, rowCount);
            }

            let changed = this.rectangleList.adjustForYRangeInserted(rowIndex, rowCount);
            if (this.rows.adjustForInserted(rowIndex, rowCount)) {
                changed = true;
            }

            if (changed) {
                this.flagChanged(false);
            }
        } finally {
            this.endChange();
        }

        const snapshot = this._snapshot;
        if (snapshot !== undefined) {
            snapshot.adjustForRowsInserted(rowIndex, rowCount);
        }
    }

    adjustForRowsDeleted(rowIndex: number, rowCount: number) {
        this.beginChange();
        try {
            const lastArea = this._lastArea;
            if (lastArea !== undefined) {
                lastArea.adjustForYRangeDeleted(rowIndex, rowCount);
            }

            let changed = this.rectangleList.adjustForYRangeDeleted(rowIndex, rowCount);
            if (this.rows.adjustForDeleted(rowIndex, rowCount)) {
                changed = true;
            }

            if (changed) {
                this.flagChanged(false);
            }
        } finally {
            this.endChange();
        }

        const snapshot = this._snapshot;
        if (snapshot !== undefined) {
            snapshot.adjustForRowsDeleted(rowIndex, rowCount);
        }
    }

    adjustForRowsMoved(oldRowIndex: number, newRowIndex: number, count: number) {
        this.beginChange();
        try {
            const lastArea = this._lastArea;
            if (lastArea !== undefined) {
                lastArea.adjustForYRangeMoved(oldRowIndex, newRowIndex, count);
            }

            let changed = this.rectangleList.adjustForYRangeMoved(oldRowIndex, newRowIndex, count);
            if (this.rows.adjustForMoved(oldRowIndex, newRowIndex, count)) {
                changed = true;
            }

            if (changed) {
                this.flagChanged(false);
            }
        } finally {
            this.endChange();
        }

        const snapshot = this._snapshot;
        if (snapshot !== undefined) {
            snapshot.adjustForRowsMoved(oldRowIndex, newRowIndex, count);
        }
    }

    adjustForColumnsInserted(columnIndex: number, columnCount: number) {
        this.beginChange();
        try {
            const lastArea = this._lastArea;
            if (lastArea !== undefined) {
                lastArea.adjustForXRangeInserted(columnIndex, columnCount);
            }

            let changed = this.rectangleList.adjustForXRangeInserted(columnIndex, columnCount);
            if (this.columns.adjustForInserted(columnIndex, columnCount)) {
                changed = true;
            }

            if (changed) {
                this.flagChanged(false);
            }
        } finally {
            this.endChange();
        }

        const snapshot = this._snapshot;
        if (snapshot !== undefined) {
            snapshot.adjustForColumnsInserted(columnIndex, columnCount);
        }
    }

    adjustForColumnsDeleted(columnIndex: number, columnCount: number) {
        this.beginChange();
        try {
            const lastArea = this._lastArea;
            if (lastArea !== undefined) {
                lastArea.adjustForXRangeDeleted(columnIndex, columnCount);
            }

            let changed = this.rectangleList.adjustForXRangeDeleted(columnIndex, columnCount);
            if (this.columns.adjustForDeleted(columnIndex, columnCount)) {
                changed = true;
            }

            if (changed) {
                this.flagChanged(false);
            }
        } finally {
            this.endChange();
        }

        const snapshot = this._snapshot;
        if (snapshot !== undefined) {
            snapshot.adjustForColumnsDeleted(columnIndex, columnCount);
        }
    }

    adjustForColumnsMoved(oldColumnIndex: number, newColumnIndex: number, count: number) {
        this.beginChange();
        try {
            const lastArea = this._lastArea;
            if (lastArea !== undefined) {
                lastArea.adjustForXRangeMoved(oldColumnIndex, newColumnIndex, count);
            }

            let changed = false; // this.rectangleList.adjustForColumnsMoved(oldColumnIndex, newColumnIndex, count); // not yet implemented
            if (this.columns.adjustForMoved(oldColumnIndex, newColumnIndex, count)) {
                changed = true;
            }

            if (changed) {
                this.flagChanged(false);
            }
        } finally {
            this.endChange();
        }

        const snapshot = this._snapshot;
        if (snapshot !== undefined) {
            snapshot.adjustForColumnsMoved(oldColumnIndex, newColumnIndex, count);
        }
    }

    private handleSubgridChanged() {
        this.clear();
    }

    private flagChanged(silently: boolean) {
        if (silently) {
            // Can only flag as silently if no other change was silent
            if (!this._changed) {
                this._silentlyChanged = true;
            } else {
                this._silentlyChanged = false;
            }
        }
        this._changed = true;
    }

    private stash() {
        if (this._stash !== undefined) {
            throw new AssertError('MSSS86665');
        } else {
            this._stash = this.createStash();
            this.clear();
        }
    }

    private unstash() {
        const selectionStash = this._stash;
        if (selectionStash === undefined) {
            throw new AssertError('MSUS86665');
        } else {
            this._stash = undefined;
            this.restoreStash(selectionStash);
        }
    }

    private createStash() {
        const singleFirstCellPosition = this.createSingleFirstCellPositionStash();
        const rowIds = this.createRowsStash();
        const columnNames = this.createColumnsStash();

        return new SelectionStash(
            singleFirstCellPosition,
            this.allRowsSelected,
            rowIds,
            columnNames,
        );
    }

    private restoreStash(stash: SelectionStash) {
        this.beginChange();
        try {
            this.clear();
            this.restoreSingleFirstCellPositionStash(stash.singleFirstCellPosition);
            this.allRowsSelected = stash.allRowsSelected;
            this.restoreRowsStash(stash.rowIds);
            this.restoreColumnsStash(stash.columnNames);
        } finally {
            this.endChange();
        }
    }

    private createSingleFirstCellPositionStash(): SelectionStash.SingleFirstCellPosition | undefined {
        const gridProps = this._gridProperties;
        const propertiesAllow = gridProps.restoreSingleCellSelection;
        if (!propertiesAllow) {
            return undefined;
        } else {
            const rectangle = this.rectangleList.getLastRectangle();
            if (rectangle === undefined) {
                return undefined;
            } else {
                const dataModel = this._focus.subgrid.dataModel;
                if (dataModel.getRowIdFromIndex === undefined) {
                    return undefined;
                } else {
                    const firstSelectedCell = rectangle.first;
                    return {
                        columnName: this._columnsManager.getActiveColumn(firstSelectedCell.x).name,
                        rowId: dataModel.getRowIdFromIndex(firstSelectedCell.y),
                    };
                }
            }
        }
    }

    private restoreSingleFirstCellPositionStash(singleFirstCellPosition: SelectionStash.SingleFirstCellPosition | undefined) {
        if (singleFirstCellPosition !== undefined) {
            const { columnName, rowId: stashedRowId } = singleFirstCellPosition;
            const subgrid = this.focusedSubgrid;

            const selectedColumnIndex = this._columnsManager.getActiveColumnIndexByName(columnName);
            if (selectedColumnIndex >= 0) {
                const dataModel = subgrid.dataModel;
                if (dataModel.getRowIndexFromId !== undefined) {
                    const rowIndex = dataModel.getRowIndexFromId(stashedRowId);
                    if (rowIndex !== undefined) {
                        this.selectRectangle(selectedColumnIndex, rowIndex, 0, 0, subgrid);
                    }
                } else {
                    if (dataModel.getRowIdFromIndex !== undefined) {
                        const rowCount = subgrid.getRowCount();
                        for (let rowIndex = 0; rowIndex < rowCount; ++rowIndex) {
                            const rowId = dataModel.getRowIdFromIndex(rowIndex);
                            if (rowId === stashedRowId) {
                                this.selectRectangle(selectedColumnIndex, rowIndex, 0, 0, subgrid);
                                break;
                            }
                        }
                    }
                }
            }
        }

    }

    /**
     * Save underlying data row indexes backing current grid row selections in `grid.selectedDataRowIndexes`.
     *
     * This call should be paired with a subsequent call to `reselectRowsByUnderlyingIndexes`.
     * @returns Number of selected rows or `undefined` if `restoreRowSelections` is falsy.
     */
    private createRowsStash() {
        const gridProps = this._gridProperties;
        const propertiesAllow = gridProps.restoreRowSelections && gridProps.rowSelection;
        if (!propertiesAllow) {
            return undefined;
        } else {
            const dataModel = this._focus.subgrid.dataModel;
            const getRowIdFromIndexFtn = dataModel.getRowIdFromIndex;
            if (getRowIdFromIndexFtn === undefined) {
                return undefined;
            } else {
                const boundGetRowIdFromIndexFtn = getRowIdFromIndexFtn.bind(dataModel);
                const selectedRowIndices = this.getRowIndices();
                return selectedRowIndices.map( (selectedRowIndex) => boundGetRowIdFromIndexFtn(selectedRowIndex) );
            }
        }
    }

    private restoreRowsStash(rowIds: unknown[] | undefined) {
        if (rowIds !== undefined) {
            const rowIdCount = rowIds.length;
            if (rowIdCount > 0) {
                const rowCount = this._focus.subgrid.getRowCount();
                const dataModel = this._focus.subgrid.dataModel;

                let rowIndexValues: number[] | undefined;
                let rowIndexValueCount = 0;
                if (dataModel.getRowIndexFromId !== undefined) {
                    rowIndexValues = new Array<number>(rowIdCount);
                    for (let i = 0; i < rowIdCount; i++) {
                        const rowId = rowIds[i];
                        const rowIndex = dataModel.getRowIndexFromId(rowId);
                        if (rowIndex !== undefined) {
                            rowIndexValues[rowIndexValueCount++] = rowIndex;
                        }
                    }
                } else {
                    if (dataModel.getRowIdFromIndex !== undefined) {
                        rowIndexValues = new Array<number>(rowIdCount);
                        for (let rowIndex = 0; rowIndex < rowCount; ++rowIndex) {
                            const rowId = dataModel.getRowIdFromIndex(rowIndex);
                            const rowIdIndex = rowIds.indexOf(rowId);
                            if (rowIdIndex >= 0) {
                                rowIndexValues[rowIndexValueCount++] = rowIndex;
                                rowIds.splice(rowIdIndex, 1);
                                if (rowIds.length === 0) {
                                    break;
                                }
                            }
                        }
                    }
                }

                if (rowIndexValues !== undefined && rowIndexValueCount > 0) {
                    // Sort selected row indices so that sequential indices can be selected in ranges
                    rowIndexValues.length = rowIndexValueCount;
                    rowIndexValues.sort((left, right) => left - right);
                    let startValue = rowIndexValues[0];
                    let previousValue = startValue;
                    let previousValuePlus1 = previousValue + 1;
                    for (let i = 1; i < rowIndexValueCount; i++) {
                        const value = rowIndexValues[i];
                        if (value !== previousValue) {
                            if (value !== previousValuePlus1) {
                                this.selectRows(startValue, previousValue, undefined, undefined);
                                startValue = value;
                            }
                            previousValue = value;
                            previousValuePlus1 = previousValue + 1;
                        }
                    }
                    this.selectRows(startValue, previousValue, undefined, undefined);
                }
            }
        }
    }

    /**
     * Save data column names of current column selections in `grid.selectedColumnNames`.
     *
     * This call should be paired with a subsequent call to `reselectColumnsByNames`.
     * @returns Number of selected columns or `undefined` if `restoreColumnSelections` is falsy.
     */
    private createColumnsStash() {
        // selectionModel should be moved into Subgrid
        if (!this._gridProperties.restoreColumnSelections) {
            return undefined;
        } else {
            const selectedColumns = this.getColumnIndices();
            return selectedColumns.map( (selectedColumnIndex) => this._columnsManager.getActiveColumn(selectedColumnIndex).name );
        }
    }

    private restoreColumnsStash(columnNames: string[] | undefined) {
        if (columnNames !== undefined) {
            const columnNamesCount = columnNames.length;
            if (columnNamesCount > 0) {
                const columnsManager = this._columnsManager;

                const indexValues = new Array<number>(columnNamesCount);
                let indexValueCount = 0;
                for (const columnName in columnNames) {
                    const activeColumnIndex = columnsManager.getActiveColumnIndexByName(columnName);
                    if (activeColumnIndex >= 0) {
                        indexValues[indexValueCount++] = activeColumnIndex;
                    }
                }

                if (indexValues !== undefined && indexValueCount > 0) {
                    // Sort selected column indices so that sequential indices can be selected in ranges
                    indexValues.length = indexValueCount;
                    indexValues.sort((left, right) => left - right);
                    let startValue = indexValues[0];
                    let previousValue = startValue;
                    let previousValuePlus1 = previousValue + 1;
                    for (let i = 1; i < indexValueCount; i++) {
                        const value = indexValues[i];
                        if (value !== previousValue) {
                            if (value !== previousValuePlus1) {
                                this.selectColumns(startValue, previousValue);
                                startValue = value;
                            }
                            previousValue = value;
                            previousValuePlus1 = previousValue + 1;
                        }
                    }
                    this.selectColumns(startValue, previousValue);
                }
            }
        }
    }

    private calculateAreaType(specifier: SelectionArea.TypeSpecifier): SelectionArea.Type {
        switch (specifier) {
            case SelectionArea.TypeSpecifier.Primary: return this._gridProperties.primarySelectionAreaType;
            case SelectionArea.TypeSpecifier.Secondary: return this._gridProperties.secondarySelectionAreaType;
            case SelectionArea.TypeSpecifier.Rectangle: return SelectionArea.Type.Rectangle;
            case SelectionArea.TypeSpecifier.Row: return SelectionArea.Type.Row;
            case SelectionArea.TypeSpecifier.Column: return SelectionArea.Type.Column;
            case SelectionArea.TypeSpecifier.LastOrPrimary: {
                const lastArea = this._lastArea;
                if (lastArea === undefined) {
                    return this.calculateAreaType(SelectionArea.TypeSpecifier.Primary);
                } else {
                    return lastArea.areaType;
                }
            }
            default:
                throw new UnreachableCaseError('SCAT60711', specifier);
        }
    }
}

/** @public */
export namespace Selection {
    export type ChangedEventer = (this: void) => void;

    export interface CellSelectedAreaTypes {
        rowSelected: boolean;
        columnSelected: boolean;
        cellSelected: boolean;
    }
}
