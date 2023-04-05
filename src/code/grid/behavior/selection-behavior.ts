import { ColumnsManager } from '../column/columns-manager';
import { GridProperties } from '../grid-properties';
import { Renderer } from '../renderer/renderer';
import { Selection } from '../selection/selection';
import { Subgrid } from '../subgrid/subgrid';
import { Mouse } from '../user-interface-input/mouse';

export class SelectionBehavior {
    constructor(
        private readonly _selection: Selection,
        private readonly _gridProperties: GridProperties,
        private readonly _columnsManager: ColumnsManager,
        private readonly _renderer: Renderer,
        private readonly _mouse: Mouse,
        private readonly _repaintEventer: SelectionBehavior.RepaintEventer,
        private readonly _columnSelectionChangedEventer: SelectionBehavior.ColumnSelectionChangedEventer,
        private readonly _scrollToMakeVisibleEventer: SelectionBehavior.ScrollToMakeVisibleEventer,
    ) {

    }

    /** Call before multiple selection changes to consolidate SelectionChange events.
     * Pair with endSelectionChange().
     */
    beginChange() {
        this._selection.beginChange();
    }

    /** Call after multiple selection changes to consolidate SelectionChange events.
     * Pair with beginSelectionChange().
     */
    endChange() {
        this._selection.endChange();
    }

    selectColumns(x1: number, x2: number) {
        this._selection.selectColumns(x1, x2);
    }

    toggleSelectColumn(x: number, shiftKeyDown: boolean, ctrlKeyDown: boolean) {
        this._selection.toggleSelectColumn(x, shiftKeyDown, ctrlKeyDown);
        this._repaintEventer();
        this._columnSelectionChangedEventer();
    }

    selectRows(y1: number, y2: number, subgrid: Subgrid | undefined, focusColumnIndex: number | undefined) {
        this._selection.selectRows(y1, y2, subgrid, focusColumnIndex);
    }

    toggleSelectRow(y: number, shiftKeyDown: boolean, subgrid: Subgrid | undefined) {
        this._selection.toggleSelectRow(y, shiftKeyDown, subgrid);
        this._repaintEventer();
    }

    selectAllRows() {
        this._selection.selectAllRows();
    }

    toggleSelectAllRows(forceClearRows = true) {
        if (this._selection.allRowsSelected) {
            this._selection.clear(forceClearRows);
        } else {
            this._selection.selectAllRows();
        }
        this._repaintEventer();
    }

    selectRectangle(ox: number, oy: number, ex: number, ey: number, subgrid: Subgrid | undefined) {
        this._selection.selectRectangle(ox, oy, ex, ey, subgrid);
    }


    /**
     * @desc Clear all the selections.
     */
    clearSelection(forceClearRows: boolean) {
        this._selection.clear(forceClearRows);
        this._mouse.clearMouseDown();
    }

    clearMostRecentColumnSelection() {
        this._selection.restorePreviousColumnSelection();
    }

    /**
     * @desc Clear the most recent row selection.
     */
    clearMostRecentRowSelection() {
        //this.selection.clearMostRecentRowSelection(); // commented off as per GRID-112
    }

    /**
     * @desc Clear the most recent selection.
     */
    clearMostRecentRectangleSelection() {
        this._selection.clearMostRecentRectangleSelection();
    }

    focusCell(newX: number, newY: number, subgrid: Subgrid | undefined) {
        const selection = this._selection;
        if (subgrid === undefined) {
            subgrid = selection.focusedSubgrid;
        }
        let lastColumnIndex = this._columnsManager.getActiveColumnCount() - 1;
        let lastSubgridRowIndex = subgrid.getRowCount() - 1;

        const lastViewableColumnIndex = this._renderer.getVisibleColumnsCount() - 1;
        const lastViewableRowIndex = this._renderer.getVisibleRowsCount() - 1;

        if (!this._gridProperties.scrollingEnabled) {
            lastColumnIndex = Math.min(lastColumnIndex, lastViewableColumnIndex);
            lastSubgridRowIndex = Math.min(lastSubgridRowIndex, lastViewableRowIndex);
        }

        newX = Math.min(lastColumnIndex, Math.max(0, newX));
        newY = Math.min(lastSubgridRowIndex, Math.max(0, newY));

        selection.beginChange();
        try {
            selection.clear();
            selection.selectRectangle(newX, newY, 0, 0, undefined);
            // this._userInterfaceInputBehavior.setMouseDown(Point.create(newX, newY));
            // this._userInterfaceInputBehavior.setDragExtent(Point.create(0, 0));

            this._scrollToMakeVisibleEventer(newX, newY, subgrid);
        } finally {
            selection.endChange();
        }

        this._repaintEventer();
    }

}

export namespace SelectionBehavior {
    export type RepaintEventer = (this: void) => void;
    export type ColumnSelectionChangedEventer = (this: void) => void;
    export type ScrollToMakeVisibleEventer = (this: void, x: number, y: number, subgrid: Subgrid) => void;
}
