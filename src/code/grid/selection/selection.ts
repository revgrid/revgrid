
import { InclusiveRectangle } from '../lib/inclusive-rectangle';
import { AssertError } from '../lib/revgrid-error';
import { Revgrid } from '../revgrid';
import { RangesSelection } from './ranges-selection';
import { SelectionDetailAccessor } from './selection-detail';
import { SelectionRectangle } from './selection-rectangle';

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
    private _lastSelectionType: SelectionModel.LastSelectionType[];
    private _allRowsSelected = false;

    private _beginChangeCount = 0;
    private _changed = false;
    private _silentlyChanged = false;

    constructor(private readonly grid: Revgrid) {
        this.reset();
    }

    reset() {
        /**
         * @summary The selection rectangles.
         * @desc Created as an empty array upon instantiation by the {@link Selection|constructor}.
         */
        this.rectangles.length = 0;

        /**
         * @summary The selection rectangles flattened in the horizontal direction (no width).
         * @desc Created as an empty array upon instantiation by the {@link Selection|constructor}.
         */
        this._flattenedX.length = 0;

        /**
         * @summary The selection rectangles flattened in the vertical direction (no height).
         * @desc Created as an empty array upon instantiation by the {@link Selection|constructor}.
         */
        this._flattenedY.length = 0;

        /**
         * @summary The selection rectangles.
         * @desc Created as a new RangeSelectionModel upon instantiation by the {@link Selection|constructor}.
         */
        this.rows.clear();

        /**
         * @summary The selection rectangles.
         * @desc Created as a new RangeSelectionModel upon instantiation by the {@link Selection|constructor}.
         */
        this.columns.clear();

        this._lastSelectionType = [];
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

                const gridProps = this.grid.properties;

                if (!gridProps.checkboxOnlyRowSelections && gridProps.autoSelectRows) {
                    // Project the cell selection into the rows
                    this.selectRowsFromCellsOrLastRectangle();
                }

                if (gridProps.autoSelectColumns) {
                    // Project the cell selection into the columns
                    this.selectColumnsFromCells();
                }

                if (!silentlyChanged) {
                    this.grid.fireSyntheticSelectionChangedEvent(new SelectionDetailAccessor(this))
                }
            }
        } else {
            if (this._beginChangeCount < 0) {
                throw new AssertError('SMEC91004', 'Mismatched SelectionModel begin/endChange callback');
            }
        }
    }

    selectRowsFromCellsOrLastRectangle() {
        if (!this.grid.properties.singleRowSelectionMode) {
            this.selectRowsFromCells(0, true);
        } else {
            const last = this.getLastRectangle();
            if (last !== undefined) {
                this.clearRowSelection();
                this.selectRows(last.corner.y);
            } else {
                this.clearRowSelection();
            }
        }
        this.grid.fireSyntheticRowSelectionChangedEvent();
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
     * Returns empty string (`''`) if there are no selections.
     */
    getLastSelectionType(n?: number) {
        return this._lastSelectionType[n ?? 0] || '';
    }

    /**
     * Set the most recent selection's `type`. That is, push onto TOS of `this.lastSelectionType`, the stack of unique selection types. If already in the stack, move it to the top.
     *
     * If `reset` is truthy, remove the given `type` from the stack, regardless of where found therein (or not), thus "revealing" the 2nd most recently pushed type.
     *
     * @param type - One of: `'cell'`, `'row'`, or `'column'`
     * @param reset - Remove the given `type` from the stack. Specify truthy when the only remaining previous selection of `type` has been deselected.
     */
    setLastSelectionType(type: SelectionModel.LastSelectionType, reset?: boolean) {
        const i = this._lastSelectionType.indexOf(type);
        if (i === 0 && !reset) {
            return;
        }
        if (i >= 0) {
            this._lastSelectionType.splice(i, 1);
        }
        if (!reset) {
            this._lastSelectionType.unshift(type);
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
    selectRectangle(originX: number, originY: number, extentX: number, extentY: number, silent?: boolean) {
        this.beginChange();
        try {
            const newRectangle = new SelectionRectangle(originX, originY, extentX + 1, extentY + 1);

            if (this.grid.properties.multipleSelections) {
                this.rectangles.push(newRectangle);
                // Following can be cast as Rectangle constructor used which uses unchanged extent
                this._flattenedX.push(newRectangle.newXFlattened(0));
                this._flattenedY.push(newRectangle.newYFlattened(0));
            } else {
                this.rectangles[0] = newRectangle;
                this._flattenedX[0] = newRectangle.newXFlattened(0);
                this._flattenedY[0] = newRectangle.newYFlattened(0);
            }
            this.setLastSelectionType('cell');

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
    toggleSelect(ox: number, oy: number, ex: number, ey: number) {

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
                this.setLastSelectionType('cell', !this.rectangles.length);
                this.flagChanged(false);
            } finally {
                this.endChange();
            }
        } else {
            this.selectRectangle(ox, oy, ex, ey);
        }
    }

    /**
     * @desc Remove the last selection that was created.
     */
    clearMostRecentSelection(keepRowSelections: boolean) {
        this.beginChange();
        try {
            console.debug('clearmostrecent');
            if (!keepRowSelections) {
                this.setAllRowsSelected(false);
            }
            const changed = this.rectangles.length > 0;
            if (changed) { --this.rectangles.length; }
            if (this._flattenedX.length) { --this._flattenedX.length; }
            if (this._flattenedY.length) { --this._flattenedY.length; }
            this.setLastSelectionType('cell', !this.rectangles.length);

            if (changed) {
                this.flagChanged(false);
            }
        } finally {
            this.endChange();
        }
    }

    restorePreviousColumnSelection() {
        this.columns.restorePreviousSelection();
        this.setLastSelectionType('column', !this.columns.ranges.length);
    }

    restorePreviousRowSelection() {
        this.rows.restorePreviousSelection();
        this.setLastSelectionType('row', !this.rows.ranges.length);
    }

    clearRowSelection() {
        this.rows.clear();
        this.setLastSelectionType('row', !this.rows.ranges.length);
    }

    hasRectangles() {
        return this.rectangles.length !== 0;
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
    isSelected(x: number, y: number): boolean {
        return (
            this.isColumnSelected(x) ||
            this.isRowSelected(y) ||
            this.anyRectangleContainPoint(this.rectangles, x, y)
        );
    }

    isCellSelected(x: number, y: number) {
        return this.anyRectangleContainPoint(this.rectangles, x, y);
    }

    private anyRectangleContainPoint(rectangles: InclusiveRectangle[], x: number, y: number) {
        return rectangles.find((rectangle) => rectangle.containsXY(x, y)) !== undefined;
    }

    /**
     * @desc empty out all our state
     */
    clear(keepRowSelections?: boolean) {
        this.beginChange();
        try {
            const changed = this.rectangles.length > 0;
            this.rectangles.length = 0;
            this._flattenedX.length = 0;
            this._flattenedY.length = 0;
            this.columns.clear();
            if (!keepRowSelections) {
                this._lastSelectionType.length = 0;
                this.setAllRowsSelected(false);
                this.rows.clear();
            } else if (this._lastSelectionType.indexOf('row') >= 0) {
                this._lastSelectionType = ['row'];
            } else {
                this._lastSelectionType.length = 0;
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

    isRowSelected(y: number) {
        return this._allRowsSelected || this.rows.isSelected(y);
    }

    isRowFocused(y: number) {
        const rectangles = this.rectangles
        return rectangles.length > 0 && rectangles[0].firstSelectedCell.y === y;
    }

    selectColumns(x1: number, x2?: number) {
        this.columns.select(x1, x2);
        this.setLastSelectionType('column', !this.columns.ranges.length);
    }

    selectAllRows() {
        this.clear();
        this.setAllRowsSelected(true);
    }

    setAllRowsSelected(isIt: boolean) {
        this._allRowsSelected = isIt;
    }

    areAllRowsSelected() {
        return this._allRowsSelected;
    }

    selectRows(y1: number, y2?: number) {
        this.rows.select(y1, y2);
        this.setLastSelectionType('row', !this.rows.ranges.length);
    }

    deselectColumn(x1: number, x2?: number) {
        this.columns.deselect(x1, x2);
        this.setLastSelectionType('column', !this.columns.ranges.length);
    }

    deselectRow(y1: number, y2?: number) {
        if (this.areAllRowsSelected()) {
            // To deselect a row, we must first remove the all rows flag...
            this.setAllRowsSelected(false);
            // ...and create a single range representing all rows
            this.rows.select(0, this.grid.getRowCount() - 1);
        }
        this.rows.deselect(y1, y2);
        this.setLastSelectionType('row', !this.rows.ranges.length);
    }

    getRowCount() {
        if (this.areAllRowsSelected()) {
            return this.grid.getRowCount();
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
                    const rectangleIndices = this.getRectanglesRowIndices();
                    const allIndices = [...rangeIndices, ...rectangleIndices];
                    allIndices.sort((left, right) => left - right);
                    const allCount = allIndices.length;
                    let previousIndex = allIndices[0];
                    let uniqueCount = 1;
                    for (let i = 1; i < allCount; i++) {
                        const index = allIndices[i];
                        if (index !== previousIndex) {
                            uniqueCount++;
                            previousIndex = index;
                        }
                    }
                    return uniqueCount;
                }
            }
        }
    }

    getRowIndices() {
        if (this.areAllRowsSelected()) {
            const rowCount = this.grid.getRowCount();
            const result = new Array<number>(rowCount);
            for (let i = 0; i < rowCount; i++) {
                result[i] = i;
            }
            return result;
        } else {
            return this.rows.getIndices();
        }
    }

    getSelectedColumnIndices() {
        return this.columns.getIndices();
    }

    isColumnOrRowSelected() {
        return !this.columns.isEmpty() || !this.rows.isEmpty();
    }

    getFlattenedYs() {
        const result = Array<number>();
        const set = {};
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

    selectRowsFromCells(offset: number, keepRowSelections: boolean) {
        offset = offset || 0;

        const sm = this.rows;

        if (!keepRowSelections) {
            this.setAllRowsSelected(false);
            sm.clear();
        }

        this.rectangles.forEach((rectangle) => {
            let top = rectangle.origin.y;
            const extent = rectangle.extent.y;
            top += offset;
            sm.select(top, top + extent);
        });
    }

    selectColumnsFromCells(offset?: number) {
        offset = offset || 0;

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

    private getRectanglesRowCount() {
        let count = 0;
        const rectangles = this.rectangles;
        const rectangleCount = rectangles.length;
        for (let i = 0; i < rectangleCount; i++) {
            const rectangle = rectangles[i];
            count += rectangle.height;
        }
        return count;
    }

    private getRectanglesRowIndices() {
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
}

export namespace SelectionModel {
    export const enum LastSelectionTypeEnum {
        cell = 'cell',
        column = 'column',
        row = 'row',
    }
    export type LastSelectionType = keyof typeof LastSelectionTypeEnum;
}
