
import { ColumnsManager } from '../column/columns-manager';
import { Focus } from '../focus';
import { GridProperties } from '../grid-properties';
import { InclusiveRectangle } from '../lib/inclusive-rectangle';
import { AssertError } from '../lib/revgrid-error';
import { calculateNumberArrayUniqueCount } from '../lib/utils';
import { Revgrid } from '../revgrid';
import { Subgrid } from '../subgrid/subgrid';
import { RangesSelection } from './ranges-selection';
import { SelectionDetailAccessor } from './selection-detail';
import { SelectionRectangle } from './selection-rectangle';
import { SelectionStash } from './selection-stash';
import { SelectionType } from './selection-type';

/**
 *
 * @desc We represent selections as a list of rectangles because large areas can be represented and tested against quickly with a minimal amount of memory usage. Also we need to maintain the selection rectangles flattened counter parts so we can test for single dimension contains. This is how we know to highlight the fixed regions on the edges of the grid.
 */

export class Selection {
    readonly rows = new RangesSelection();
    readonly columns = new RangesSelection();
    readonly rectangles: SelectionRectangle[] = [];

    private readonly _flattenedX = new Array<InclusiveRectangle>();
    private readonly _flattenedY = new Array<InclusiveRectangle>();
    private readonly _lastSelectionTypes = new Array<SelectionType>();
    private _allRowsSelected = false;

    private _beginChangeCount = 0;
    private _changed = false;
    private _silentlyChanged = false;

    private _lastEdgeSelectionX = 0;
    private _lastEdgeSelectionY = 0;

    /** @internal */
    private _nestedStashSelectionsRequestCount = 0;
    /** @internal */
    private _stash: SelectionStash | undefined;

    constructor(
        private readonly _grid: Revgrid,
        private readonly _gridProperties: GridProperties,
        private readonly _columnsManager: ColumnsManager,
        private readonly _focus: Focus,
    ) {
        _focus.subgridChanged_SelectionEventer = () => this.handleSubgridChanged();
    }

    get focusedSubgrid() { return this._focus.subgrid; }

    get hasRectangles() { return this.rectangles.length !== 0; }

    get allRowsSelected() { return this._allRowsSelected; }
    set allRowsSelected(value: boolean) {
        this.beginChange();
        if (value !== this._allRowsSelected) {
            this._allRowsSelected = value;
            this._changed = true;
        }
        this.endChange();
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

                const gridProps = this._gridProperties;

                if (!gridProps.checkboxOnlyRowSelections && gridProps.autoSelectRows) {
                    // Project the cell selection into the rows
                    this.selectRowsFromCellsOrLastRectangle();
                }

                if (gridProps.autoSelectColumns) {
                    // Project the cell selection into the columns
                    this.selectColumnsFromCells();
                }

                if (!silentlyChanged) {
                    this._grid.fireSyntheticSelectionChangedEvent(new SelectionDetailAccessor(this))
                }
            }
        } else {
            if (this._beginChangeCount < 0) {
                throw new AssertError('SMEC91004', 'Mismatched SelectionModel begin/endChange callback');
            }
        }
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

    selectRowsFromCellsOrLastRectangle() {
        if (!this._gridProperties.singleRowSelectionMode) {
            this.selectRowsFromRectangles(0, true);
        } else {
            const last = this.getLastRectangle();
            if (last !== undefined) {
                this.clearRowSelection();
                const columnIndex = last.firstSelectedCell.x
                const start = last.origin.y;
                const stop = last.corner.y;
                this.selectRows(start, stop, undefined, columnIndex);
            } else {
                this.clearRowSelection();
            }
        }
        this._grid.fireSyntheticRowSelectionChangedEvent();
    }



    flagChanged(silently: boolean) {
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

    getLastRectangle() {
        const rectangles = this.rectangles;
        if (rectangles.length > 0) {
            return rectangles[rectangles.length - 1];
        } else {
            return undefined;
        }
    }

    /**
     * The most recent selection type. This is the TOS of `this.lastSelectionType`, the stack of unique selection types.
     *
     * Note that in the case where the only remaining previous selection of `type` was deselected, and `setLastSelectionType` was called with `reset` truthy, `type` is removed from the stack. If it was previously TOS, the TOS will now be what was the 2nd most recently pushed type (or nothing if no other selections).
     *
     * Returns undefined if there are no selections.
     */
    getLastSelectionType(n = 0) {
        if (this._lastSelectionTypes.length === 0) {
            return undefined;
        } else {
            return this._lastSelectionTypes[n];
        }
    }

    /**
     * Set the most recent selection's `type`. That is, push onto TOS of `this.lastSelectionType`, the stack of unique selection types. If already in the stack, move it to the top.
     *
     * If `reset` is truthy, remove the given `type` from the stack, regardless of where found therein (or not), thus "revealing" the 2nd most recently pushed type.
     *
     * @param type - Selection Type
     * @param reset - Remove the given `type` from the stack. Specify truthy when the only remaining previous selection of `type` has been deselected.
     */
    setLastSelectionType(type: SelectionType, reset = false) {
        const i = this._lastSelectionTypes.indexOf(type);
        if (i === 0 && !reset) {
            return;
        }
        if (i >= 0) {
            this._lastSelectionTypes.splice(i, 1);
        }
        if (!reset) {
            this._lastSelectionTypes.unshift(type);
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
    selectRectangle(originX: number, originY: number, extentX: number, extentY: number, subgrid: Subgrid | undefined, silent = false) {
        this.beginChange();
        try {
            if (subgrid === undefined) {
                subgrid = this._focus.subgrid;
            }
            this._focus.setXYCoordinatesAndSubgrid(originX, originY, subgrid);

            const newRectangle = new SelectionRectangle(originX, originY, extentX + 1, extentY + 1);

            if (this._gridProperties.multipleSelections) {
                this.rectangles.push(newRectangle);
                // Following can be cast as Rectangle constructor used which uses unchanged extent
                this._flattenedX.push(newRectangle.newXFlattened(0));
                this._flattenedY.push(newRectangle.newYFlattened(0));
            } else {
                this.rectangles.length = 1;
                this.rectangles[0] = newRectangle;
                this._flattenedX.length = 1;
                this._flattenedX[0] = newRectangle.newXFlattened(0);
                this._flattenedY.length = 1;
                this._flattenedY[0] = newRectangle.newYFlattened(0);
            }
            this.setLastSelectionType(SelectionType.Cell);

            this.flagChanged(silent);
        } finally {
            this.endChange()
        }
    }

    /**
     * @param ox - origin x coordinate
     * @param oy - origin y coordinate
     * @param ex - extent x coordinate
     * @param ey - extent y coordinate
     */
    toggleRectangleSelect(ox: number, oy: number, ex: number, ey: number, subgrid: Subgrid | undefined) {

        const index = this.rectangles.findIndex((rectangle) => {
            return (
                rectangle.origin.x === ox && rectangle.origin.y === oy &&
                rectangle.extent.x === ex && rectangle.extent.y === ey
            );
        });

        if (index >= 0) {
            this.beginChange();
            try {
                this.rectangles.splice(index, 1);
                this._flattenedX.splice(index, 1);
                this._flattenedY.splice(index, 1);
                this.setLastSelectionType(SelectionType.Cell, !this.rectangles.length);
                this.flagChanged(false);
            } finally {
                this.endChange();
            }
        } else {
            this.selectRectangle(ox, oy, ex, ey, subgrid);
        }
    }

    /**
     * @desc Remove the last selection that was created.
     */
    clearMostRecentRectangleSelection() {
        this.beginChange();
        try {
            console.debug('clearmostrecent');
            const keepRowSelections = this._gridProperties.checkboxOnlyRowSelections;
            if (!keepRowSelections) {
                this.allRowsSelected = false;
            }
            const changed = this.rectangles.length > 0;
            if (changed) { --this.rectangles.length; }
            if (this._flattenedX.length) { --this._flattenedX.length; }
            if (this._flattenedY.length) { --this._flattenedY.length; }
            this.setLastSelectionType(SelectionType.Cell, !this.rectangles.length);

            if (changed) {
                this.flagChanged(false);
            }
        } finally {
            this.endChange();
        }
    }

    restorePreviousColumnSelection() {
        this.columns.restorePreviousSelection();
        this.setLastSelectionType(SelectionType.Column, !this.columns.ranges.length);
    }

    restorePreviousRowSelection() {
        this.rows.restorePreviousSelection();
        this.setLastSelectionType(SelectionType.Row, !this.rows.ranges.length);
    }

    clearRowSelection() {
        this.beginChange();
        this.allRowsSelected = false;
        this.rows.clear();
        this.setLastSelectionType(SelectionType.Row, !this.rows.ranges.length);
        this.endChange();
    }

    hasRowSelections() {
        return !this.rows.isEmpty();
    }

    hasColumnSelections() {
        return !this.columns.isEmpty();
    }

    /**
     * @return Selection covers a specific column.
     */
    isCellSelectedInRow(y: number): boolean {
        return this.anyRectangleContainPoint(this._flattenedX, 0, y);
    }

    isCellSelectedInColumn(x: number) {
        return this.anyRectangleContainPoint(this._flattenedY, x, 0);
    }

    /**
     * @summary Selection query function.
     * @returns The given cell is selected (part of an active selection).
     */
    isSelected(x: number, y: number, subgrid: Subgrid, ): boolean {
        const { rowSelected, columnSelected, cellSelected } = this.getRowColumnCellSelected(x, y, subgrid);
        return (rowSelected || columnSelected || cellSelected);
    }

    isCellSelected(x: number, y: number, subgrid: Subgrid) {
        return subgrid === this.focusedSubgrid && this.anyRectangleContainPoint(this.rectangles, x, y);
    }

    private anyRectangleContainPoint(rectangles: InclusiveRectangle[], x: number, y: number) {
        return rectangles.find((rectangle) => rectangle.containsXY(x, y)) !== undefined;
    }

    /**
     * @desc empty out all our state
     */
    clear(forceClearRows = true) {
        this.beginChange();
        try {
            let changed = this.rectangles.length > 0 || !this.columns.isEmpty;
            this.rectangles.length = 0;
            this._flattenedX.length = 0;
            this._flattenedY.length = 0;
            this.columns.clear();
            const clearRows = forceClearRows || !this._gridProperties.checkboxOnlyRowSelections;
            if (!clearRows) {
                changed ||= !this.rows.isEmpty || this.allRowsSelected;
                this._lastSelectionTypes.length = 0;
                this.allRowsSelected = false;
                this.rows.clear();
            } else {
                if (this._lastSelectionTypes.includes(SelectionType.Row)) {
                    this._lastSelectionTypes.length = 1
                    this._lastSelectionTypes[0] = SelectionType.Row;
                } else {
                    this._lastSelectionTypes.length = 0;
                }
            }
            if (changed) {
                this.flagChanged(false); // was previously not flagged as changed
            }
        } finally {
            this.endChange();
        }
    }

    /**
     * @param ox - origin x coordinate
     * @param oy - origin y coordinate
     * @param ex - extent x coordinate
     * @param ey - extent y coordinate
     */
    isRectangleSelected(ox: number, oy: number, ex: number, ey: number): boolean {
        return this.rectangles.find(
            (rectangle) => {
                return (
                    rectangle.origin.x === ox && rectangle.origin.y === oy &&
                    rectangle.extent.x === ex && rectangle.extent.y === ey
                );
            }
        ) !== undefined;
    }

    isColumnSelected(x: number) {
        return this.columns.isSelected(x);
    }

    isRowSelected(y: number, subgrid: Subgrid | undefined) {
        const selected =
            (subgrid === undefined || subgrid === this.focusedSubgrid)
            &&
            (this._allRowsSelected || this.rows.isSelected(y));
        return selected;
    }

    getRowColumnCellSelected(x: number, y: number, subgrid: Subgrid): Selection.RowColumnCellSelected {
        if (subgrid === this.focusedSubgrid) {
            return {
                rowSelected: this._allRowsSelected || this.rows.isSelected(y),
                columnSelected: this.columns.isSelected(x),
                cellSelected: this.anyRectangleContainPoint(this.rectangles, x, y),
            };
        } else {
            return {
                rowSelected: false,
                columnSelected: false,
                cellSelected: false,
            };
        }
    }

    isRowFocused(y: number) {
        const rectangles = this.rectangles
        return rectangles.length > 0 && rectangles[0].firstSelectedCell.y === y;
    }

    selectColumns(start: number, stop: number) {
        this.beginChange();
        const changed = this.columns.select(start, stop);
        if (changed) {
            this.setLastSelectionType(SelectionType.Column, this.rows.ranges.length === 0);
            this.flagChanged(false);
        }
        this.endChange();
    }

    toggleSelectColumn(x: number, shiftKeyDown: boolean, ctrlKeyDown: boolean) {
        const alreadySelected = this.isColumnSelected(x);
        this.beginChange();
        try {
            if (!ctrlKeyDown && !shiftKeyDown) {
                this.clear();
                if (!alreadySelected) {
                    this.selectColumns(x, x);
                }
            } else {
                if (ctrlKeyDown) {
                    if (alreadySelected) {
                        this.deselectColumn(x, x);
                    } else {
                        this.selectColumns(x, x);
                    }
                }
                if (shiftKeyDown) {
                    this.clear();
                    this.selectColumns(this._lastEdgeSelectionX, x);
                }
            }
            if (!alreadySelected && !shiftKeyDown) {
                this._lastEdgeSelectionX = x;
            }
        } finally {
            this.endChange();
        }
    }


    selectAllRows() {
        this.clear();
        this.allRowsSelected = true;
    }

    selectRows(start: number, stop: number, subgrid: Subgrid | undefined, focusColumnIndex: number | undefined) {
        this.beginChange();

        if (this._gridProperties.singleRowSelectionMode) {
            this.clearRowSelection();
            stop = start;
        }

        if (subgrid === undefined) {
            subgrid = this._focus.subgrid;
        }

        if (focusColumnIndex === undefined) {
            this._focus.setYCoordinateAndSubgrid(start, subgrid);
        } else {
            this._focus.setXYCoordinatesAndSubgrid(focusColumnIndex, start, subgrid);
        }

        const changed = this.rows.select(start, stop);
        if (changed) {
            this.setLastSelectionType(SelectionType.Row, this.rows.ranges.length === 0);
            this.flagChanged(false);
        }
        this.endChange();
    }

    toggleSelectRow(y: number, shiftKeyDown: boolean, subgrid: Subgrid | undefined) {
        //we can select the totals rows if they exist, but not rows above that
        const alreadySelected = this.isRowSelected(y, subgrid);

        this.beginChange();
        try {
            if (alreadySelected) {
                this.deselectRow(y);
            } else {
                if (this._gridProperties.singleRowSelectionMode) {
                    this.clearRowSelection();
                }
                this.selectRows(y, y, subgrid, undefined);
            }

            if (shiftKeyDown) {
                this.clear();
                this.selectRows(this._lastEdgeSelectionY, y, subgrid, undefined);
            }

            if (!alreadySelected && !shiftKeyDown) {
                this._lastEdgeSelectionY = y;
            }
        } finally {
            this.endChange();
        }
    }

    deselectColumn(start: number, stop: number) {
        this.columns.deselect(start, stop);
        this.setLastSelectionType(SelectionType.Column, this.columns.ranges.length === 0);
    }

    deselectRow(start: number, stop?: number) {
        if (this.allRowsSelected) {
            // To deselect a row, we must first remove the all rows flag...
            this.allRowsSelected = false;
            // ...and create a single range representing all rows
            this.rows.select(0, this._focus.subgrid.getRowCount() - 1);
        }
        this.rows.deselect(start, stop);
        this.setLastSelectionType(SelectionType.Row, this.rows.ranges.length === 0);
    }

    getRowCount() {
        if (this.allRowsSelected) {
            return this._focus.subgrid.getRowCount();
        } else {
            const ranges = this.rows.ranges;
            const rectangles = this.rectangles;
            if (ranges.length === 0) {
                return this.getRectanglesRowCount();
            } else {
                if (rectangles.length === 0) {
                    return this.rows.getCount();
                } else {
                    const rangeIndices = this.rows.getIndices();
                    const rectangleIndices = this.getRectanglesNonUniqueRowIndices();
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

    getFlattenedYs() {
        const result = Array<number>();
        const set: Record<number, boolean> = {};
        this.rectangles.forEach((rectangle) => {
            const top = rectangle.origin.y;
            const size = rectangle.height;
            for (let r = 0; r < size; r++) {
                const ti = r + top;
                if (!set[ti]) {
                    result.push(ti);
                    set[ti] = true;
                }
            }
        });

        result.sort((x, y) => {
            return x - y;
        });

        return result;
    }

    selectRowsFromRectangles(offset: number, keepRowSelections: boolean) {
        const rows = this.rows;

        if (!keepRowSelections) {
            this.allRowsSelected = false;
            this.clearRowSelection();
        }

        const last = this.getLastRectangle();

        this.rectangles.forEach((rectangle) => {
            if (rectangle !== last) {
                let start = rectangle.origin.y;
                const extent = rectangle.extent.y;
                start += offset;
                rows.select(start, start + extent);
            }
        });

        if (last !== undefined) {
            const columnIndex = last.firstSelectedCell.x
            let start = last.origin.y;
            const extent = last.extent.y;
            start += offset;
            this.selectRows(start, start + extent, undefined, columnIndex);
        }
    }

    selectColumnsFromCells(offset = 0) {
        const sm = this.columns;
        sm.clear();

        this.rectangles.forEach((rectangle) => {
            let left = rectangle.origin.x;
            const extent = rectangle.extent.x;
            left += offset;
            sm.select(left, left + extent);
        });
    }

    isInCurrentSelectionRectangle(x: number, y: number) {
        const lastRectangle = this.getLastRectangle();
        if (lastRectangle === undefined) {
            return false;
        } else {
            return lastRectangle.containsXY(x, y);
        }
    }

    adjustForRowsInserted(rowIndex: number, rowCount: number) {
        const rectangles = this.rectangles;
        const rectangleCount = rectangles.length;
        if (rectangleCount > 0) {
            this.beginChange();
            try {
                let changed = false;
                for (let i = rectangleCount - 1; i >= 0; i--) {
                    const rectangle = rectangles[i];
                    if (rectangle.adjustForRowsInserted(rowIndex, rowCount)) {
                    // if (adjustedSelection !== undefined) {
                    //     selections[i] = adjustedSelection;
                        changed = true;
                    }
                }

                if (changed) {
                    this.flagChanged(false);
                }
            } finally {
                this.endChange();
            }
        }
    }

    adjustForRowsDeleted(rowIndex: number, rowCount: number) {
        const rectangles = this.rectangles;
        const rectangleCount = rectangles.length;
        if (rectangleCount > 0) {
            this.beginChange();
            try {
                let changed = false;
                for (let i = rectangleCount - 1; i >= 0; i--) {
                    const rectangle = rectangles[i];
                    const adjustmentResult = rectangle.adjustForRowsDeleted(rowIndex, rowCount);
                    if (adjustmentResult === null) {
                        rectangles.splice(i, 1);
                    } else {
                        if (adjustmentResult) {
                            changed = true;
                        }
                    }
                }

                if (changed) {
                    this.flagChanged(false);
                }
            } finally {
                this.endChange();
            }
        }
    }

    adjustForRowsMoved(oldRowIndex: number, newRowIndex: number, count: number) {
        const rectangles = this.rectangles;
        const rectangleCount = rectangles.length;
        if (rectangleCount > 0) {
            this.beginChange();
            try {
                // this could probably be better optimised
                this.adjustForRowsDeleted(oldRowIndex, count);
                this.adjustForRowsInserted(newRowIndex, count);
            } finally {
                this.endChange();
            }
        }
    }

    adjustForColumnsInserted(columnIndex: number, columnCount: number) {
        const rectangles = this.rectangles;
        const rectangleCount = rectangles.length;
        if (rectangleCount > 0) {
            this.beginChange();
            try {
                let changed = false;
                for (let i = this.rectangles.length - 1; i >= 0; i--) {
                    const rectangle = rectangles[i];
                    if (rectangle.adjustForColumnsInserted(columnIndex, columnCount)) {
                        changed = true;
                    }
                }

                if (changed) {
                    this.flagChanged(false);
                }
            } finally {
                this.endChange();
            }
        }
    }

    adjustForColumnsDeleted(columnIndex: number, columnCount: number) {
        const rectangles = this.rectangles;
        const rectangleCount = rectangles.length;
        if (rectangleCount > 0) {
            this.beginChange();
            try {
                let changed = false;
                for (let i = this.rectangles.length - 1; i >= 0; i--) {
                    const rectangle = rectangles[i];
                    const adjustedResult = rectangle.adjustForColumnsDeleted(columnIndex, columnCount);
                    if (adjustedResult === null) {
                        rectangles.splice(i, 1);
                    } else {
                        if (adjustedResult) {
                            changed = true;
                        }
                    }
                }

                if (changed) {
                    this.flagChanged(false);
                }
            } finally {
                this.endChange();
            }
        }
    }

    private handleSubgridChanged() {
        this.clear();
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

    private getRectanglesRowCount() {
        const rectangles = this.rectangles;
        const rectangleCount = rectangles.length;
        if (rectangleCount === 0) {
            return 0;
        } else {
            if (rectangleCount === 1) {
                return rectangles[0].height;
            } else {
                const nonUniqueIndices = this.getRectanglesNonUniqueRowIndices();
                return calculateNumberArrayUniqueCount(nonUniqueIndices);
            }
        }
    }

    private getRectanglesNonUniqueRowIndices() {
        const indices: number[] = [];
        const rectangles = this.rectangles;
        const rectangleCount = rectangles.length;
        for (let i = 0; i < rectangleCount; i++) {
            const rectangle = rectangles[i];
            const first = rectangle.y;
            const last = rectangle.corner.y;
            for (let index = first; index <= last; index++) {
                indices.push(index);
            }
        }
        return indices;
    }

    private createSingleFirstCellPositionStash(): SelectionStash.SingleFirstCellPosition | undefined {
        const gridProps = this._gridProperties;
        const propertiesAllow = gridProps.restoreSingleCellSelection && gridProps.cellSelection && !gridProps.multipleSelections;
        if (!propertiesAllow) {
            return undefined;
        } else {
            const rectangles = this.rectangles;
            if (rectangles.length !== 1) {
                return undefined;
            } else {
                const dataModel = this._focus.subgrid.dataModel;
                if (dataModel.getRowIdFromIndex === undefined) {
                    return undefined;
                } else {
                    const rectangle = rectangles[0];
                    const firstSelectedCell = rectangle.firstSelectedCell;
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
}

/** @public */
export namespace Selection {
    export interface RowColumnCellSelected {
        rowSelected: boolean;
        columnSelected: boolean;
        cellSelected: boolean;
    }
}
