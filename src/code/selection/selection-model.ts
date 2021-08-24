
import { Hypegrid } from '../grid/hypegrid';
import { InclusiveRectangle } from '../lib/inclusive-rectangle';
import { Point } from '../lib/point';
import { Rectangle } from '../lib/rectangular';
import { RangeSelectionModel } from './range-selection-model';

/**
 *
 * @desc We represent selections as a list of rectangles because large areas can be represented and tested against quickly with a minimal amount of memory usage. Also we need to maintain the selection rectangles flattened counter parts so we can test for single dimension contains. This is how we know to highlight the fixed regions on the edges of the grid.
 */

export class SelectionModel {
    private selections: Rectangle[];
    private flattenedX: Rectangle[];
    private flattenedY: Rectangle[];
    private lastSelectionType: SelectionModel.LastSelectionType[];
    private allRowsSelected = false;

    rowSelectionModel: RangeSelectionModel;
    columnSelectionModel: RangeSelectionModel;

    constructor(private readonly grid: Hypegrid) {
        this.reset();
    }

    reset() {
        /**
         * @summary The selection rectangles.
         * @desc Created as an empty array upon instantiation by the {@link SelectionModel|constructor}.
         */
        this.selections = [];

        /**
         * @summary The selection rectangles flattened in the horizontal direction (no width).
         * @desc Created as an empty array upon instantiation by the {@link SelectionModel|constructor}.
         */
        this.flattenedX = [];

        /**
         * @summary The selection rectangles flattened in the vertical direction (no height).
         * @desc Created as an empty array upon instantiation by the {@link SelectionModel|constructor}.
         */
        this.flattenedY = [];

        /**
         * @summary The selection rectangles.
         * @desc Created as a new RangeSelectionModel upon instantiation by the {@link SelectionModel|constructor}.
         */
        this.rowSelectionModel = new RangeSelectionModel();

        /**
         * @summary The selection rectangles.
         * @desc Created as a new RangeSelectionModel upon instantiation by the {@link SelectionModel|constructor}.
         */
        this.columnSelectionModel = new RangeSelectionModel();

        this.lastSelectionType = [];
    }

    getLastSelection() {
        const sels = this.selections;
        if (sels.length > 0) {
            return sels[sels.length - 1];
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
        return this.lastSelectionType[n ?? 0] || '';
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
        const i = this.lastSelectionType.indexOf(type);
        if (i === 0 && !reset) {
            return;
        }
        if (i >= 0) {
            this.lastSelectionType.splice(i, 1);
        }
        if (!reset) {
            this.lastSelectionType.unshift(type);
        }
    }

    /**
     * @description Select the region described by the given coordinates.
     *
     * @param ox - origin x coordinate
     * @param oy - origin y coordinate
     * @param ex - extent x coordinate
     * @param ey - extent y coordinate
     * @param silent - whether to fire selection changed event
     */
    select(ox: number, oy: number, ex: number, ey: number, silent?: boolean) {
        const newSelection = new SelectionModel.NewSelection(ox, oy, ex + 1, ey + 1);

        //Cache the first selected cell before it gets normalized to top-left origin
        newSelection.firstSelectedCell = this.grid.newPoint(ox, oy);

        newSelection.lastSelectedCell = (
            newSelection.firstSelectedCell.x === newSelection.origin.x &&
            newSelection.firstSelectedCell.y === newSelection.origin.y
        )
            ? newSelection.corner
            : newSelection.origin;

        if (this.grid.properties.multipleSelections) {
            this.selections.push(newSelection);
            this.flattenedX.push(newSelection.flattenXAt(0));
            this.flattenedY.push(newSelection.flattenYAt(0));
        } else {
            this.selections[0] = newSelection;
            this.flattenedX[0] = newSelection.flattenXAt(0);
            this.flattenedY[0] = newSelection.flattenYAt(0);
        }
        this.setLastSelectionType('cell');

        this.grid.selectionChanged(silent);
    }

    /**
     * @param ox - origin x coordinate
     * @param oy - origin y coordinate
     * @param ex - extent x coordinate
     * @param ey - extent y coordinate
     */
    toggleSelect(ox: number, oy: number, ex: number, ey: number) {

        const index = this.selections.findIndex((selection) => {
            return (
                selection.origin.x === ox && selection.origin.y === oy &&
                selection.extent.x === ex && selection.extent.y === ey
            );
        });

        if (index >= 0) {
            this.selections.splice(index, 1);
            this.flattenedX.splice(index, 1);
            this.flattenedY.splice(index, 1);
            this.setLastSelectionType('cell', !this.selections.length);
            this.grid.selectionChanged();
        } else {
            this.select(ox, oy, ex, ey);
        }
    }

    /**
     * @desc Remove the last selection that was created.
     */
    clearMostRecentSelection(keepRowSelections: boolean) {
        if (!keepRowSelections) {
            this.setAllRowsSelected(false);
        }
        if (this.selections.length) { --this.selections.length; }
        if (this.flattenedX.length) { --this.flattenedX.length; }
        if (this.flattenedY.length) { --this.flattenedY.length; }
        this.setLastSelectionType('cell', !this.selections.length);
        //this.getGrid().selectionChanged();
    }

    clearMostRecentColumnSelection() {
        this.columnSelectionModel.clearMostRecentSelection();
        this.setLastSelectionType('column', !this.columnSelectionModel.selection.length);
    }

    clearMostRecentRowSelection() {
        this.rowSelectionModel.clearMostRecentSelection();
        this.setLastSelectionType('row', !this.rowSelectionModel.selection.length);
    }

    clearRowSelection() {
        this.rowSelectionModel.clear();
        this.setLastSelectionType('row', !this.rowSelectionModel.selection.length);
    }

    getSelections() {
        return this.selections;
    }

    hasSelections() {
        return this.selections.length !== 0;
    }

    hasRowSelections() {
        return !this.rowSelectionModel.isEmpty();
    }

    hasColumnSelections() {
        return !this.columnSelectionModel.isEmpty();
    }

    /**
     * @return Selection covers a specific column.
     */
    isCellSelectedInRow(y: number): boolean {
        return this._isCellSelected(this.flattenedX, 0, y);
    }

    isCellSelectedInColumn(x: number) {
        return this._isCellSelected(this.flattenedY, x, 0);
    }

    /**
     * @summary Selection query function.
     * @returns The given cell is selected (part of an active selection).
     */
    isSelected(x: number, y: number): boolean {
        return (
            this.isColumnSelected(x) ||
            this.isRowSelected(y) ||
            this._isCellSelected(this.selections, x, y)
        );
    }

    isCellSelected(x: number, y: number) {
        return this._isCellSelected(this.selections, x, y);
    }

    private _isCellSelected(selections: Rectangle[], x: number, y: number) {
        return !!selections.find((selection) => this.rectangleContains(selection, x, y));
    }

    /**
     * @desc empty out all our state
     */
    clear(keepRowSelections?: boolean) {
        this.selections.length = 0;
        this.flattenedX.length = 0;
        this.flattenedY.length = 0;
        this.columnSelectionModel.clear();
        if (!keepRowSelections) {
            this.lastSelectionType.length = 0;
            this.setAllRowsSelected(false);
            this.rowSelectionModel.clear();
        } else if (this.lastSelectionType.indexOf('row') >= 0) {
            this.lastSelectionType = ['row'];
        } else {
            this.lastSelectionType.length = 0;
        }
        //this.getGrid().selectionChanged();
    }

    /**
     * @param ox - origin x coordinate
     * @param oy - origin y coordinate
     * @param ex - extent x coordinate
     * @param ey - extent y coordinate
     */
    isRectangleSelected(ox: number, oy: number, ex: number, ey: number): boolean {
        return !!this.selections.find(function(selection) {
            return (
                selection.origin.x === ox && selection.origin.y === oy &&
                selection.extent.x === ex && selection.extent.y === ey
            );
        });
    }

    isColumnSelected(x: number) {
        return this.columnSelectionModel.isSelected(x);
    }

    isRowSelected(y: number) {
        return this.allRowsSelected || this.rowSelectionModel.isSelected(y);
    }

    selectColumn(x1: number, x2?: number) {
        this.columnSelectionModel.select(x1, x2);
        this.setLastSelectionType('column', !this.columnSelectionModel.selection.length);
    }

    selectAllRows() {
        this.clear();
        this.setAllRowsSelected(true);
    }

    setAllRowsSelected(isIt: boolean) {
        this.allRowsSelected = isIt;
    }

    areAllRowsSelected() {
        return this.allRowsSelected;
    }

    selectRow(y1: number, y2?: number) {
        this.rowSelectionModel.select(y1, y2);
        this.setLastSelectionType('row', !this.rowSelectionModel.selection.length);
    }

    deselectColumn(x1: number, x2?: number) {
        this.columnSelectionModel.deselect(x1, x2);
        this.setLastSelectionType('column', !this.columnSelectionModel.selection.length);
    }

    deselectRow(y1: number, y2?: number) {
        if (this.areAllRowsSelected()) {
            // To deselect a row, we must first remove the all rows flag...
            this.setAllRowsSelected(false);
            // ...and create a single range representing all rows
            this.rowSelectionModel.select(0, this.grid.getRowCount() - 1);
        }
        this.rowSelectionModel.deselect(y1, y2);
        this.setLastSelectionType('row', !this.rowSelectionModel.selection.length);
    }

    getSelectedRows() {
        if (this.areAllRowsSelected()) {
            const rowCount = this.grid.getRowCount();
            const result = new Array<number>(rowCount);
            for (let i = 0; i < rowCount; i++) {
                result[i] = i;
            }
            return result;
        }
        return this.rowSelectionModel.getSelections();
    }

    getSelectedColumns() {
        return this.columnSelectionModel.getSelections();
    }

    isColumnOrRowSelected() {
        return !this.columnSelectionModel.isEmpty() || !this.rowSelectionModel.isEmpty();
    }

    getFlattenedYs() {
        const result = Array<number>();
        const set = {};
        this.selections.forEach((selection) => {
            const top = selection.origin.y;
            const size = selection.height;
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

        const sm = this.rowSelectionModel;

        if (!keepRowSelections) {
            this.setAllRowsSelected(false);
            sm.clear();
        }

        this.selections.forEach((selection) => {
            let top = selection.origin.y;
            const extent = selection.extent.y;
            top += offset;
            sm.select(top, top + extent);
        });
    }

    selectColumnsFromCells(offset?: number) {
        offset = offset || 0;

        const sm = this.columnSelectionModel;
        sm.clear();

        this.selections.forEach((selection) => {
            let left = selection.origin.x;
            const extent = selection.extent.x;
            left += offset;
            sm.select(left, left + extent);
        });
    }

    isInCurrentSelectionRectangle(x: number, y: number) {
        const last = this.getLastSelection();
        return last && this.rectangleContains(last, x, y);
    }

    rectangleContains(rect: Rectangle, x: number, y: number) { //TODO: explore why this works and contains on rectanglular does not
        let minX = rect.origin.x;
        let minY = rect.origin.y;
        let maxX = minX + rect.extent.x;
        let maxY = minY + rect.extent.y;

        if (rect.extent.x < 0) {
            minX = maxX;
            maxX = rect.origin.x;
        }

        if (rect.extent.y < 0) {
            minY = maxY;
            maxY = rect.origin.y;
        }

        const result =
            x >= minX &&
            y >= minY &&
            x <= maxX &&
            y <= maxY;

        return result;
    }
}

export namespace SelectionModel {
    export const enum LastSelectionTypeEnum {
        cell = 'cell',
        column = 'column',
        row = 'row',
    }
    export type LastSelectionType = keyof typeof LastSelectionTypeEnum;

    export class NewSelection extends InclusiveRectangle {
        firstSelectedCell: Point;
        lastSelectedCell: Point;
    }
}
