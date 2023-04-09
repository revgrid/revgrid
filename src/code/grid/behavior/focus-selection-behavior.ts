import { ColumnsManager } from '../column/columns-manager';
import { Focus } from '../focus';
import { GridProperties } from '../grid-properties';
import { AssertError } from '../lib/revgrid-error';
import { SelectionArea } from '../lib/selection-area';
import { Renderer } from '../renderer/renderer';
import { Selection } from '../selection/selection';
import { Subgrid } from '../subgrid/subgrid';
import { SubgridsManager } from '../subgrid/subgrids-manager';
import { Mouse } from '../user-interface-input/mouse';

export class FocusSelectionBehavior {
    constructor(
        private readonly _selection: Selection,
        private readonly _focus: Focus,
        private readonly _gridProperties: GridProperties,
        private readonly _columnsManager: ColumnsManager,
        private readonly _subgridsManager: SubgridsManager,
        private readonly _renderer: Renderer,
        private readonly _mouse: Mouse,
        private readonly _repaintEventer: SelectionBehavior.RepaintEventer,
        private readonly _selectionChangedEventer: SelectionBehavior.SelectionChangedEventer,
        private readonly _scrollToMakeVisibleEventer: SelectionBehavior.ScrollToMakeVisibleEventer,
    ) {
        this._selection.changedEventer = () => this._selectionChangedEventer();
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

    getLastSelectionType() {
        return this._selection.getLastSelectionAreaType();
    }

    isPointSelected(x: number, y: number, subgrid: Subgrid): boolean {
        return this._selection.isPointSelected(x, y, subgrid);
    }

    selectColumns(x1: number, x2: number) {
        this._selection.selectAndFocusColumns(x1, x2);
    }

    toggleSelectColumn(x: number, shiftKeyDown: boolean, ctrlKeyDown: boolean) {
        this._selection.toggleSelectColumn(x, shiftKeyDown, ctrlKeyDown);
        this._repaintEventer();
        this._selectionChangedEventer();
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

    moveCellFocus(offsetX: number, offsetY: number, areaTypeSpecifier: SelectionArea.TypeSpecifier) {
        const focusPoint = this._focus.point;
        if (focusPoint === undefined) {
            throw new AssertError('SBMCF41087');
        } else {
            const focusX = focusPoint.x;
            const focusY = focusPoint.y;
            this.focusSelectOnlyCell(focusX + offsetX, focusY + offsetY, undefined, areaTypeSpecifier);
        }
    }

    focusSelectOnlyCell(originX: number, originY: number, subgrid: Subgrid | undefined, areaTypeSpecifier: SelectionArea.TypeSpecifier) {
        const selection = this._selection;
        if (subgrid === undefined) {
            subgrid = selection.focusedSubgrid;
        }

        const lastViewableColumnIndex = this._renderer.getVisibleColumnsCount() - 1;
        const lastViewableRowIndex = this._renderer.getVisibleRowsCount() - 1;

        let lastColumnIndex = this._columnsManager.getActiveColumnCount() - 1;
        let lastSubgridRowIndex = subgrid.getRowCount() - 1;

        if (!this._gridProperties.scrollingEnabled) {
            lastColumnIndex = Math.min(lastColumnIndex, lastViewableColumnIndex);
            lastSubgridRowIndex = Math.min(lastSubgridRowIndex, lastViewableRowIndex);
        }

        originX = Math.min(lastColumnIndex, Math.max(0, originX));
        originY = Math.min(lastSubgridRowIndex, Math.max(0, originY));

        this.beginChange();
        selection.clear();
        this._focus.setXYCoordinatesAndSubgrid(originX, originY, subgrid);
        selection.selectCell(originX, originY, subgrid, areaTypeSpecifier);
        this.endChange();

        this._scrollToMakeVisibleEventer(newX, newY, subgrid);

        this._repaintEventer();
    }

    replaceLastAreaFromLastOrigin(extentX: number, extentY: number, areaTypeSpecifier: SelectionArea.TypeSpecifier) {

    }

    selectAdditionalCell(originX: number, originY: number, areaTypeSpecifier: SelectionArea.TypeSpecifier) {

    }

    add

    /** @summary Extend cell selection by offset.
     * @desc Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
     * @param offsetX - x coordinate to start at
     * @param offsetY - y coordinate to start at
     */
    extendLastArea(offsetX: number, offsetY: number) {
        const selection = this._selection;

        const area = getLastArea
        let maxColumns = this.getActiveColumnCount() - 1;
        let maxRows = this.getSubgridRowCount(subgrid) - 1;

        const maxViewableColumns = this.renderer.visibleColumns.length - 1;
        const maxViewableRows = this.renderer.visibleRows.length - 1;

        const origin = this._userInterfaceInputBehavior.getMouseDown();
        const extent = this._userInterfaceInputBehavior.getDragExtent();

        if (origin === undefined || extent === undefined) {
            throw new AssertError('RGES01034');
        } else {
            let newX = extent.x + offsetX;
            let newY = extent.y + offsetY;

            if (!this.properties.scrollingEnabled) {
                maxColumns = Math.min(maxColumns, maxViewableColumns);
                maxRows = Math.min(maxRows, maxViewableRows);
            }

            newX = Math.min(maxColumns - origin.x, Math.max(-origin.x, newX));
            newY = Math.min(maxRows - origin.y, Math.max(-origin.y, newY));

            selection.beginChange();
            try {
                this.clearMostRecentRectangleSelection();
                selection.selectRectangle(origin.x, origin.y, newX, newY, subgrid);
            } finally {
                selection.endChange();
            }
            this._userInterfaceInputBehavior.setDragExtent(Point.create(newX, newY));

            const colScrolled = this.ensureModelColIsVisible(newX + origin.x, offsetX);
            const rowScrolled = this.ensureModelRowIsVisible(newY + origin.y, offsetY, subgrid);

            this.repaint();

            return colScrolled || rowScrolled;
        }
    }

    selectViewportCell(x: number, y: number, areaTypeSpecifier: SelectionArea.TypeSpecifier) {
        const visibleColumns = this._renderer.visibleColumns;
        if (x < visibleColumns.length) {
            const vc = this._renderer.visibleColumns[x]
            const visibleRows = this._renderer.visibleRows;
            if (y < visibleRows.length) {
                const vr = this._renderer.visibleRows[y];
                x = vc.activeColumnIndex;
                y = vr.rowIndex;
                const subgrid = this._subgridsManager.getSubgridByHandle(vr.subgrid);
                this._selection.selectCell(x, y, subgrid, areaTypeSpecifier);
                this._repaintEventer();
            }
        }
    }

}

export namespace SelectionBehavior {
    export type RepaintEventer = (this: void) => void;
    export type SelectionChangedEventer = (this: void) => void;
    export type ScrollToMakeVisibleEventer = (this: void, x: number, y: number, subgrid: Subgrid) => void;
}
